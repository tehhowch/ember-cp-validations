import { isEmpty, isNone } from '@ember/utils';
import moment from 'moment';
import EmberValidator from 'ember-cp-validations/-private/ember-validator';

/**
 *  <i class="fa fa-hand-o-right" aria-hidden="true"></i> [See All Options](#method_validate)
 *
 *  Validate over a date range. Uses [MomentJS](http://momentjs.com/) for date mathematics and calculations.
 *
 *  **Note**: MomentJS must be installed to be able to use this validator. The easiest way to do this is to install [ember-moment](https://github.com/stefanpenner/ember-moment)
 *
 * ## Examples
 *
 * If `before`, `onOrBefore`, `after`, or `onOrAfter` is set to **now**, the value given to the validator will be tested against the current date and time.
 *
 *  ```javascript
 *  validator('date', {
 *    after: 'now',
 *    before: '1/1/2020',
 *    precision: 'day',
 *    format: 'M/D/YYY',
 *    errorFormat: 'M/D/YYY'
 *  })
 *  ```
 *
 *  @class Date
 *  @module Validators
 *  @extends Base
 */
export default EmberValidator.extend({
  _evType: 'date',

  /**
   * A reimplementation of the v2 Date validator from ember-validators, since v3 removed support for most
   * desired validation errors.
   * @param {any} value A string, null, or moment object
   * @param {Record<string, string|moment|boolean>} options
   * @returns {true|string} true if passed, otherwise the error message
   */
  validate(value, options) {
    if (options.allowNone && isNone(value)) return true;
    if (options.allowBlank && isEmpty(value)) return true;

    const hasFormat = Boolean(options.format);

    // Parse the value. If a format was given, the input must be in that format.
    const parsed = hasFormat
      ? moment(value, options.format, true)
      : moment(value);
    if (!parsed.isValid()) {
      // If a format was given, reparse to determine whether we received something that represented a date-ish.
      // If so, then raise a 'wrongFormatError'. Otherwise, raise a date error.
      if (
        hasFormat &&
        (moment(value, options.format).isValid() || moment(value).isValid())
      ) {
        return this.createErrorMessage('wrongDateFormat', value, options);
      }
      return this.createErrorMessage('date', value, options);
    }

    // Validate all provided relational requirements are satisfied. If the
    // reference value is not currently valid, the validation will fail.
    const errorFormat = options.errorFormat || 'MMM Do, YYYY';
    const { precision } = options;
    const getRelation = (key) => {
      if (options[key] === 'now') return moment.utc();
      return moment(options[key], options.format, hasFormat);
    };
    if (typeof options.before !== 'undefined') {
      const reference = getRelation('before');

      if (!parsed.isBefore(reference, precision)) {
        return this.createErrorMessage('before', parsed, {
          ...options,
          before: reference.format(errorFormat),
        });
      }
    }

    if (typeof options.onOrBefore !== 'undefined') {
      const reference = getRelation('onOrBefore');

      if (!parsed.isSameOrBefore(reference, precision)) {
        return this.createErrorMessage('onOrBefore', parsed, {
          ...options,
          onOrBefore: reference.format(errorFormat),
        });
      }
    }

    if (typeof options.after !== 'undefined') {
      const reference = getRelation('after');

      if (!parsed.isAfter(reference, precision)) {
        return this.createErrorMessage('after', parsed, {
          ...options,
          after: reference.format(errorFormat),
        });
      }
    }

    if (typeof options.onOrAfter !== 'undefined') {
      const reference = getRelation('onOrAfter');

      if (!parsed.isSameOrAfter(reference, precision)) {
        return this.createErrorMessage('onOrAfter', parsed, {
          ...options,
          onOrAfter: reference.format(errorFormat),
        });
      }
    }

    return true;
  },
});
