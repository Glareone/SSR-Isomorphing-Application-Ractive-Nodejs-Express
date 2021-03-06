// Root component

const Ractive = require('ractive');
const api = require('./services/api');

// Ractive.DEBUG и Ractive.DEBUG_PROMISES с помощью которых мы включаем или выключаем информационные сообщения
// об ошибках в зависимости от текущего окружения.
Ractive.DEBUG = (process.env.NODE_ENV === 'development');
Ractive.DEBUG_PROMISES = Ractive.DEBUG;

// 1) флаг Ractive.defaults.enhance, активирующий один из ключевых аспектов изоморфности — переиспользование
// разметки полученный в результате SSR на клиентской стороне.
// Именно это сейчас чаще всего называют непонятным термином hydrate.

// 1.1) Если по-простому, то фишка в том, что после того, как приложение инициализируется на клиенте оно может «захотеть»
// перерендерить всю разметку взамен той разметки, которая пришла с сервера (SSR).
// Не то чтобы это супер плохо для изоморфности — поддержку SEO и многие другие плюшки мы все равно получаем.
// Однако в любом случае это крайне нерационально.

// 1.2) Поэтому важно не просто уметь делать SSR (это сейчас умеют многие).
// Хорошо еще когда ваш фреймворк умеет делать эту самую «гидрацию»,
// т.е. может проанализировать текущую разметку и данные, чтобы понять,
// что результатом повторного рендера приложения или отдельных его компонентов будет та же самая разметка,
// а значит делать этого не нужно (либо нужно, но частично). Далее, просто «оживить» существующую разметку,
// т.е. «навесить» все необходимые ивент-лисенеры, хендлеры или чего там еще ему надо.

// Все это с относительно недавнего времени умеют все представители «большой тройки».
// Ractive научился этому еще раньше, именно поэтому использует свой собственный термин «enhance»,
// вместо введенного реактом «hydrate». Просто не было тогда еще такого термина.

// По-умолчанию, этот флаг выставлен в false и данная строка кода активирует сею возможность сразу для всех
// компонентов Ractive. Другими словами, одной строчкой кода можно сделать так, чтобы ваше приложение на Ractive
// стало переиспользовать разметку с сервера. В то же время, если какой-то отдельный компонент вдруг не требует
// «гидрации», ее можно отключить локально через его опции.
Ractive.defaults.enhance = true;

// Ractive.defaults.lazy говорит фреймверку использовать поздние DOM-события (change, blur),
// вместо немедленно исполняемых (keyup, keydown) для two-way bindings (да-да, двойное связывание рулит).
Ractive.defaults.lazy = true;

// Ractive.defaults.sanitize позволяет на этапе парсинга шаблонов вырезать небезопасные html-теги.
Ractive.defaults.sanitize = true;
// переменная для использования в computed свойствах для получения keychain
Ractive.defaults.snapshot = '@global.__DATA__';

// Хелпер форматирования дат, добавлен в хелперы
Ractive.defaults.data.formatDate = require('./helpers/formatDate');
Ractive.defaults.data.errors = null;
// Подключение паршиала ошибок
Ractive.partials.errors = require('./templates/parsed/errors');

// Если вы ненавидите или боитесь двойного связывания, данная проблема решается в Ractive одной строкой:
// Ractive.defaults.twoway = false;

// Используем плагин для добавления асинхронной загрузки на сервер и клиент. Для этого заюзаем плагин ractive-ready
// Весь плагин еще примерно 100 строк кода, который заносит в прототип конструктора Ractive три дополнительных метода:
// add async operation to "waitings"
//   this.wait(promise[, key]);
// callback when all "waitings" ready
//   this.ready(callback);
// return "keychain" of instance in components hierarchy
//   this.keychain();
// Используя эти методы, мы можем определить те асинхронные операции, ожидание которых является важной частью SSR.
// А также получаем точку (функцию обратного вызова), в которой все данные, добавленные в «ожидания»,
// гарантированно добыты.
// Отдельно обращаю внимание, что данный подход дает возможность очевидным образом определять какие данные будут
// участвовать в SSR, а какие нет. Иногда это удобно для оптимизации SSR.
Ractive.use(require('ractive-ready')());
// Подключение роутинга для изоморфного приложения
Ractive.use(require('ractive-page')({
  meta: require('../config/meta.json')
}));

const options = {
  el: '#app',
  template: require('./templates/parsed/app'),
  partials: {
    navbar: require('./templates/parsed/navbar'),
    footer: require('./templates/parsed/footer'),
    homepage: require('./templates/parsed/homepage'),
    notfound: require('./templates/parsed/notfound')
  },
  transitions: {
    fade: require('ractive-transitions-fade'),
  },
  data: {
    message: 'Hello world',
    firstName: 'Aliasksei',
    lastName: 'Kalesnikau',
    articles: [] // информация по статьям, которые мы забираем асинхронно сервером
  },
  components: {
    tags: require('./components/Tags'),
    articles: require('./components/Articles'),
    profile: require('./components/Profile')
  },
  computed: {
    tags: require('./computed/tags'),
    // так можно описывать вычисляемые свойства декларативно
    fullName() {
      return this.get('firstName') + ' ' + this.get('lastName');
    }
  },
  // все там же импортируем api-сервис и пишем простой запрос на получение списка статей в хуке oninit и,
  // внимание, добавляем «обещание» в «ожидание»
  oninit () {
    const articlesKey = 'articlesList';
    const tagsKey = 'tagsList';
    // изменения необходимы для того, чтобы с сервера и с клиента не уходило 2 запроса.
    // Короче говоря, теперь данные будут загружаться на сервере, ожидаться, рендериться во время SSR,
    // приходить в структурированном виде на клиент,
    // идентифицироваться и переиспользоваться без лишних запросов к API и с гидрацией разметки.
    let articles = this.get(`@global.__DATA__.${articlesKey}`);
    let tags = this.get(`@global.__DATA__.${tagsKey}`);

    if (! tags) {
      tags = api.tags.fetchAll();
      this.wait(tags, tagsKey);
    }
    // если промиса нет-забираем на клиенте.
    if (! articles) {
      articles = api.articles.fetchAll();
      this.wait(articles, articlesKey);
    }

    this.set('articles', articles);
  }
};

module.exports = () => new Ractive(options);
