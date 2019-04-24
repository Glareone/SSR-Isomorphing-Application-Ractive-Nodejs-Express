// И конечно же все изоморфно, начальная загрузка происходит без единого ajax-запроса на клиенте.
// История браузера полностью функциональна, да и с выключенным JS все прекрасно работает. Короче угораем дальше.
//
// Компонент Profile
//
// Хотел бы я сказать, что этот компонент будет чем-то выдающимся, но нет.
// Это плюс-минус такой же автономный компонент, как и Articles и работать он будет плюс-минус также.
// На самом деле он даже скучнее, так как используется только на одной странице.
const Ractive = require('ractive');

module.exports = Ractive.extend({
  template: require('../templates/parsed/profile'),
  components: {
    articles: require('./Articles')
  },
  computed: {
    profile: require('../computed/profile')
  },
  attributes: {
    required: ['username'],
    optional: ['section']
  },
  data: () => ({
    username: '',
    section: ''
  })
});
