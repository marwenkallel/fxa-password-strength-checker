/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(['chai', 'passwordcheck'], function (chai, PasswordCheck) {
  'use strict';

  var assert = chai.assert;
  describe('passwordStrengthCheck', function () {
    var passwordcheck;

    beforeEach(function () {
      passwordcheck = new PasswordCheck();
    });

    it('returns MISSING_PASSWORD when no password is passed', function () {
      passwordcheck('', function (res) {
        assert.equal('MISSING_PASSWORD', res);
      });
    });

    it('returns PASSWORD_TOO_SHORT when password is lower than minLength', function () {
      passwordcheck('124as', function (res) {
        assert.equal('PASSWORD_TOO_SHORT', res);
      });
    });

    it('returns NOT_STRONG_ENOUGH when password is all numbers', function () {
      passwordcheck('124567890', function (res) {
        assert.equal('NOT_STRONG_ENOUGH', res);
      });
    });

    it('returns NOT_STRONG_ENOUGH when password is all letters', function () {
      passwordcheck('dragondrag', function (res) {
        assert.equal('NOT_STRONG_ENOUGH', res);
      });
    });

    it('returns BLOOMFILTER_HIT when password is in bloomfilter', function () {
      var badPasswords = ['hooters1', 'charlie2', '1loveyou', 'ihateyou1'];
      badPasswords.forEach(function (password) {
        passwordcheck(password, function (res) {
          assert.equal('BLOOMFILTER_HIT', res, password);
        });
      });
    });

    it('returns SUCCESS when password >= 12 characters', function () {
      var longPassword = 'thisis12char';
      passwordcheck(longPassword, function (res) {
        assert.equal('SUCCESS', res);
      });
    });

    it('returns SUCCESS when password is not caught by any other tests', function () {
      var goodPasswords = ['notinyourdictionary!', 'imaynotbetheretoo', 'thisisagoodcleanpassword', 'combo1234$#@'];
      goodPasswords.forEach(function (password) {
        passwordcheck(password, function (res) {
          assert.equal('SUCCESS', res, password);
        });
      });
    });
  });
});
