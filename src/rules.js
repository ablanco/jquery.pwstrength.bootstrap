/*global module, require */

/*
 * jQuery Password Strength plugin for Twitter Bootstrap
 *
 * Copyright (c) 2008-2013 Tane Piper
 * Copyright (c) 2013 Alejandro Blanco
 * Dual licensed under the MIT and GPL licenses.
 */

// eslint-disable-next-line no-implicit-globals
var rulesEngine = {};

/* eslint-disable */
try {
    if (!jQuery && module && module.exports) {
        var jQuery = require('jquery'),
            jsdom = require('jsdom').jsdom;
        jQuery = jQuery(jsdom().defaultView);
    }
} catch (ignore) {
    // Nothing to do
}
/* eslint-enable */

(function($) {
    'use strict';
    var validation = {};

    rulesEngine.forbiddenSequences = [
        '0123456789',
        'abcdefghijklmnopqrstuvwxyz',
        'qwertyuiop',
        'asdfghjkl',
        'zxcvbnm',
        '!@#$%^&*()_+'
    ];

    validation.wordNotEmail = function(options, word, score) {
        if (
            word.match(
                /^([\w!#$%&'*+\-/=?^`{|}~]+\.)*[\w!#$%&'*+\-/=?^`{|}~]+@((((([a-z0-9]{1}[a-z0-9-]{0,62}[a-z0-9]{1})|[a-z])\.)+[a-z]{2,6})|(\d{1,3}\.){3}\d{1,3}(:\d{1,5})?)$/i
            )
        ) {
            return score;
        }
        return 0;
    };

    validation.wordMinLength = function(options, word, score) {
        var wordlen = word.length,
            lenScore = Math.pow(wordlen, options.rules.raisePower);
        if (wordlen < options.common.minChar) {
            lenScore = lenScore + score;
        }
        return lenScore;
    };

    validation.wordMaxLength = function(options, word, score) {
        var wordlen = word.length,
            lenScore = Math.pow(wordlen, options.rules.raisePower);
        if (wordlen > options.common.maxChar) {
            return score;
        }
        return lenScore;
    };

    validation.wordInvalidChar = function(options, word, score) {
        if (options.common.invalidCharsRegExp.test(word)) {
            return score;
        }
        return 0;
    };

    validation.wordMinLengthStaticScore = function(options, word, score) {
        return word.length < options.common.minChar ? 0 : score;
    };

    validation.wordMaxLengthStaticScore = function(options, word, score) {
        return word.length > options.common.maxChar ? 0 : score;
    };

    validation.wordSimilarToUsername = function(options, word, score) {
        var username = $(options.common.usernameField).val();
        if (
            username &&
            word
                .toLowerCase()
                .match(
                    username
                        .replace(/[-[\]/{}()*+=?:.\\^$|!,]/g, '\\$&')
                        .toLowerCase()
                )
        ) {
            return score;
        }
        return 0;
    };

    validation.wordTwoCharacterClasses = function(options, word, score) {
        var specialCharRE = new RegExp(
            '(.' + options.rules.specialCharClass + ')'
        );

        if (
            word.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/) ||
            (word.match(/([a-zA-Z])/) && word.match(/([0-9])/)) ||
            (word.match(specialCharRE) && word.match(/[a-zA-Z0-9_]/))
        ) {
            return score;
        }
        return;
    };

    validation.wordRepetitions = function(options, word, score) {
        if (word.match(/(.)\1\1/)) {
            return score;
        }
        return 0;
    };

    validation.wordSequences = function(options, word, score) {
        var found = false,
            j;

        if (word.length > 2) {
            $.each(rulesEngine.forbiddenSequences, function(idx, seq) {
                var sequences;
                if (found) {
                    return;
                }
                sequences = [
                    seq,
                    seq
                        .split('')
                        .reverse()
                        .join('')
                ];
                $.each(sequences, function(ignore, sequence) {
                    for (j = 0; j < word.length - 2; j += 1) {
                        // iterate the word trough a sliding window of size 3:
                        if (
                            sequence.indexOf(
                                word.toLowerCase().substring(j, j + 3)
                            ) > -1
                        ) {
                            found = true;
                        }
                    }
                });
            });
            if (found) {
                return score;
            }
        }
        return 0;
    };

    validation.wordLowercase = function(options, word, score) {
        return word.match(/[a-z]/) && score;
    };

    validation.wordUppercase = function(options, word, score) {
        return word.match(/[A-Z]/) && score;
    };

    validation.wordOneNumber = function(options, word, score) {
        return word.match(/\d+/) && score;
    };

    validation.wordThreeNumbers = function(options, word, score) {
        return word.match(/(.*[0-9].*[0-9].*[0-9])/) && score;
    };

    validation.wordOneSpecialChar = function(options, word, score) {
        var specialCharRE = new RegExp(options.rules.specialCharClass);
        return word.match(specialCharRE) && score;
    };

    validation.wordTwoSpecialChar = function(options, word, score) {
        var twoSpecialCharRE = new RegExp(
            '(.*' +
                options.rules.specialCharClass +
                '.*' +
                options.rules.specialCharClass +
                ')'
        );

        return word.match(twoSpecialCharRE) && score;
    };

    validation.wordUpperLowerCombo = function(options, word, score) {
        return word.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/) && score;
    };

    validation.wordLetterNumberCombo = function(options, word, score) {
        return word.match(/([a-zA-Z])/) && word.match(/([0-9])/) && score;
    };

    validation.wordLetterNumberCharCombo = function(options, word, score) {
        var letterNumberCharComboRE = new RegExp(
            '([a-zA-Z0-9].*' +
                options.rules.specialCharClass +
                ')|(' +
                options.rules.specialCharClass +
                '.*[a-zA-Z0-9])'
        );

        return word.match(letterNumberCharComboRE) && score;
    };

    validation.wordIsACommonPassword = function(options, word, score) {
        if ($.inArray(word, options.rules.commonPasswords) >= 0) {
            return score;
        }
        return 0;
    };

    rulesEngine.validation = validation;

    rulesEngine.executeRules = function(options, word) {
        var totalScore = 0;

        $.each(options.rules.activated, function(rule, active) {
            var score, funct, result, errorMessage;

            if (active) {
                score = options.rules.scores[rule];
                funct = rulesEngine.validation[rule];

                if (typeof funct !== 'function') {
                    funct = options.rules.extra[rule];
                }

                if (typeof funct === 'function') {
                    result = funct(options, word, score);
                    if (result) {
                        totalScore += result;
                    }
                    if (result < 0 || (isNaN(parseFloat(result)) || !isFinite(result)) && !result) {
                        errorMessage = options.ui.spanError(options, rule);
                        if (errorMessage.length > 0) {
                            options.instances.errors.push(errorMessage);
                        }
                    }
                }
            }
        });

        return totalScore;
    };
})(jQuery);

try {
    if (module && module.exports) {
        module.exports = rulesEngine;
    }
} catch (ignore) {
    // Nothing to do
}
