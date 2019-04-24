const api = require('../services/api');

let _profile;
module.exports = function() {

  const username = this.get('username');

  const key = 'profileData';
  const keychain = `${this.root.snapshot}${this.keychain()}.${key}`;

  let profile = this.get(keychain);
  if (profile) {
    this.set(keychain, null);
    _profile = profile;
  } else if (_profile && _profile.username === username) {
    profile = _profile;
  } else if (username) {
    profile = api.profiles.fetch(username).then(data => (_profile = data.profile));
    this.wait(profile, key);
  }
  return profile;
};
