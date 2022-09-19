<template>
  <div :class="['vue-tel-input', styleClassesFallback, { disabled: disabledFallback }]">
    <div
      v-click-outside="clickedOutside"
      aria-label="Country Code Selector"
      aria-haspopup="listbox"
      :aria-expanded="open"
      role="button"
      :class="['vti__dropdown', { open: open, disabled: dropdownOptionsFallback.disabled }]"
      :tabindex="dropdownOptionsFallback.tabindex"
      @keydown="keyboardNav"
      @click="toggleDropdown"
      @keydown.space="toggleDropdown"
      @keydown.esc="reset"
      @keydown.tab="reset"
    >
      <span class="vti__selection">
        <span
          v-if="dropdownOptionsFallback.showFlags"
          :class="['vti__flag', activeCountryCode.toLowerCase()]"
        ></span>
        <span v-if="dropdownOptionsFallback.showDialCodeInSelection" class="vti__country-code">
          +{{ activeCountry && activeCountry.dialCode }}
        </span>
        <slot name="arrow-icon" :open="open">
          <span class="vti__dropdown-arrow">{{ open ? "▲" : "▼" }}</span>
        </slot>
      </span>
      <ul
        v-if="open"
        ref="list"
        class="vti__dropdown-list"
        :class="dropdownOpenDirection"
        role="listbox"
      >
        <li
          v-for="(pb, index) in sortedCountries"
          role="option"
          :class="['vti__dropdown-item', getItemClass(index, pb.iso2)]"
          :key="pb.iso2 + (pb.preferred ? '-preferred' : '')"
          tabindex="-1"
          @click="choose(pb)"
          @mousemove="selectedIndex = index"
          :aria-selected="activeCountryCode === pb.iso2 && !pb.preferred"
        >
          <span
            v-if="dropdownOptionsFallback.showFlags"
            :class="['vti__flag', pb.iso2.toLowerCase()]"
          ></span>
          <strong>{{ pb.name }}</strong>
          <span v-if="dropdownOptionsFallback.showDialCodeInList"> +{{ pb.dialCode }} </span>
        </li>
      </ul>
    </div>
    <input
      ref="input"
      :type="inputOptionsFallback.type"
      :autocomplete="inputOptionsFallback.autocomplete"
      :autofocus="inputOptionsFallback.autofocus"
      :class="['vti__input', inputOptionsFallback.styleClasses]"
      :disabled="disabledFallback"
      :id="inputOptionsFallback.id"
      :maxlength="inputOptionsFallback.maxlength"
      :name="inputOptionsFallback.name"
      :placeholder="parsedPlaceholder"
      :readonly="inputOptionsFallback.readonly"
      :required="inputOptionsFallback.required"
      :tabindex="inputOptionsFallback.tabindex"
      :value="modelValue"
      :aria-describedby="inputOptionsFallback['aria-describedby']"
      @blur="onBlur"
      @focus="onFocus"
      @input="onInput"
      @keyup.enter="onEnter"
      @keyup.space="onSpace"
      @update:modelValue="setModel"
    />
    <slot name="icon-right"/>
  </div>
</template>

<script lang="ts" setup>
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import utils, { getCountry, setCaretPosition } from '../utils';
import { computed, getCurrentInstance, nextTick, onMounted, ref, watch } from "vue";
import { CountryCode } from "libphonenumber-js";
import { DropdownOptions, InputOptions } from "@/index";

const instance = getCurrentInstance();

// ## Props
const props = defineProps({
  modelValue:          {
    type:    String,
    default: '',
  },
  allCountries:        {
    type:    Array,
    default: undefined,
  },
  autoFormat:          {
    type:    Boolean,
    default: undefined,
  },
  customValidate:      {
    type:    [Boolean, RegExp],
    default: undefined,
  },
  defaultCountry:      {
    // Default country code, ie: 'AU'
    // Will override the current country of user
    type:    [String, Number],
    default: undefined,
  },
  disabled:            {
    type:    Boolean,
    default: undefined,
  },
  autoDefaultCountry:  {
    type:    Boolean,
    default: undefined,
  },
  dropdownOptions:     {
    type:    Object,
    default: undefined,
  },
  ignoredCountries:    {
    type:    Array,
    default: undefined,
  },
  inputOptions:        {
    type:    Object,
    default: undefined,
  },
  invalidMsg:          {
    type:    String,
    default: undefined,
  },
  mode:                {
    type:    String,
    default: undefined,
  },
  onlyCountries:       {
    type:    Array,
    default: undefined,
  },
  preferredCountries:  {
    type:    Array,
    default: undefined,
  },
  validCharactersOnly: {
    type:    Boolean,
    default: undefined,
  },
  styleClasses:        {
    type:    [String, Array, Object],
    default: undefined,
  },
});

// ## Emits

const emits = defineEmits([
  'validate',
  'update:modelValue',
  'on-input',
  'blur',
  'focus',
  'enter',
  'space',
  'country-changed',
  'open',
  'close',
]);

// ## Data
const phone                 = ref('');
const activeCountryCode     = ref<string | CountryCode>('');
const open                  = ref(false);
const finishMounted         = ref(false);
const selectedIndex         = ref(null);
const typeToFindInput       = ref('');
const typeToFindTimer       = ref(null);
const dropdownOpenDirection = ref('below');
const parsedPlaceholder     = ref(typeof props.inputOptions?.placeholder === 'undefined' ? getDefault('inputOptions')?.placeholder : props.inputOptions?.placeholder);
const input                 = ref<HTMLInputElement>(null);
const list                  = ref<HTMLUListElement>(null);

// ## Helpers

function getDefault(key): any {
  const value = utils.options[key];
  if (typeof value === 'undefined') {
    return utils.options[key];
  }
  return value;
}

// ## Computed
const allCountriesFallback        = computed(() => typeof props.allCountries === 'undefined' ? getDefault('allCountries') : props.allCountries);
const autoFormatFallback          = computed(() => typeof props.autoFormat === 'undefined' ? getDefault('autoFormat') : props.autoFormat);
const customValidateFallback      = computed(() => typeof props.customValidate === 'undefined' ? getDefault('customValidate') : props.customValidate);
const defaultCountryFallback      = computed(() => typeof props.defaultCountry === 'undefined' ? getDefault('defaultCountry') : props.defaultCountry);
const disabledFallback            = computed(() => typeof props.disabled === 'undefined' ? getDefault('disabled') : props.disabled);
const autoDefaultCountryFallback  = computed(() => typeof props.autoDefaultCountry === 'undefined' ? getDefault('autoDefaultCountry') : props.autoDefaultCountry);
const dropdownOptionsFallback     = computed<DropdownOptions>(() => typeof props.dropdownOptions === 'undefined' ? getDefault('dropdownOptions') : props.dropdownOptions);
const ignoredCountriesFallback    = computed(() => typeof props.ignoredCountries === 'undefined' ? getDefault('ignoredCountries') : props.ignoredCountries);
const inputOptionsFallback        = computed<InputOptions>(() => typeof props.inputOptions === 'undefined' ? getDefault('inputOptions') : props.inputOptions);
const invalidMsgFallback          = computed(() => typeof props.invalidMsg === 'undefined' ? getDefault('invalidMsg') : props.invalidMsg);
const modeFallback                = computed(() => typeof props.mode === 'undefined' ? getDefault('mode') : props.mode);
const onlyCountriesFallback       = computed(() => typeof props.onlyCountries === 'undefined' ? getDefault('onlyCountries') : props.onlyCountries);
const preferredCountriesFallback  = computed(() => typeof props.preferredCountries === 'undefined' ? getDefault('preferredCountries') : props.preferredCountries);
const validCharactersOnlyFallback = computed(() => typeof props.validCharactersOnly === 'undefined' ? getDefault('validCharactersOnly') : props.validCharactersOnly);
const styleClassesFallback        = computed(() => typeof props.styleClasses === 'undefined' ? getDefault('styleClasses') : props.styleClasses);

const activeCountry = computed(() => findCountry(activeCountryCode.value));
const parsedMode    = computed(() => {
  if (modeFallback.value === 'auto') {
    if (!phone.value || phone.value[0] !== '+') {
      return 'national';
    }
    return 'international';
  }
  if (!['international', 'national'].includes(modeFallback.value)) {
    console.error('Invalid value of prop "mode"');
    return 'international';
  }
  return modeFallback.value;
});

const filteredCountries = computed(() => {
  // List countries after filtered
  if (onlyCountriesFallback.value.length) {
    return allCountriesFallback.value
      .filter(({iso2}) => onlyCountriesFallback.value.some((c) => c.toUpperCase() === iso2));
  }

  if (ignoredCountriesFallback.value.length) {
    return allCountriesFallback.value.filter(
      ({iso2}) => !ignoredCountriesFallback.value.includes(iso2.toUpperCase())
        && !ignoredCountriesFallback.value.includes(iso2.toLowerCase()),
    );
  }

  return allCountriesFallback.value;
});

const sortedCountries = computed(() => {
  // Sort the list countries: from preferred countries to all countries
  const preferredCountries = getCountries(preferredCountriesFallback.value)
    .map((country) => ({...country, preferred: true}));

  return [...preferredCountries, ...filteredCountries.value];
});

const phoneObject = computed(() => {
  let result;
  if (phone.value?.[0] === '+') {
    result = parsePhoneNumberFromString(phone.value) || {};
  } else {
    // @ts-ignore: Potential bug
    result = parsePhoneNumberFromString(phone.value, activeCountryCode.value) || {};
  }

  const {
          ...phoneObject
        } = result;

  let valid     = result.isValid?.();
  let formatted = phone.value;

  if (valid) {
    formatted = result.format?.(parsedMode.value.toUpperCase());
  }

  if (result.country && (ignoredCountriesFallback.value.length || onlyCountriesFallback.value.length)) {
    if (!findCountry(result.country)) {
      valid = false;
      Object.assign(result, {country: null});
    }
  }

  Object.assign(phoneObject, {
    countryCode: result.country,
    valid,
    country:     activeCountry.value,
    formatted,
  });

  return phoneObject;
});


onMounted(() => {
  if (props.modelValue) {
    phone.value = props.modelValue.trim();
  }

  cleanInvalidCharacters();

  initializeCountry()
    .then(() => {
      if (!phone.value
        && inputOptionsFallback.value?.showDialCode
        && activeCountryCode.value) {
        phone.value = `+${activeCountryCode.value}`;
      }
      emits('validate', phoneObject.value);
    })
    .catch(console.error)
    .then(() => {
      finishMounted.value = true;
    });
});

// ## Methods
function resetPlaceholder() {
  parsedPlaceholder.value = inputOptionsFallback.value.placeholder;
}

function initializeCountry() {
  return new Promise((resolve) => {
    /**
     * 1. If the phone included prefix (i.e. +12), try to get the country and set it
     */
    if (phone.value?.[0] === '+') {
      resolve(true);
      return;
    }

    /**
     * 2. Use default country if passed from parent
     */
    if (defaultCountryFallback.value) {
      if (typeof defaultCountryFallback.value === 'string') {
        choose(defaultCountryFallback.value);
        resolve(true);
        return;
      }

      if (typeof defaultCountryFallback.value === 'number') {
        const country = findCountryByDialCode(defaultCountryFallback.value);
        if (country) {
          choose(country.iso2);
          resolve(true);
          return;
        }
      }
    }

    const fallbackCountry = preferredCountriesFallback.value[0] || filteredCountries.value[0];
    /**
     * 3. Check if fetching country based on user's IP is allowed, set it as the default country
     */
    if (autoDefaultCountryFallback.value) {
      getCountry()
        .then((res) => {
          choose(res || activeCountryCode.value);
        })
        .catch((error) => {
          console.warn(error);
          /**
           * 4. Use the first country from preferred list (if available) or all countries list
           */
          choose(fallbackCountry);
        })
        .then(() => {
          resolve(true);
        });
    } else {
      /**
       * 4. Use the first country from preferred list (if available) or all countries list
       */
      choose(fallbackCountry);
      resolve(true);
    }
  });
}


/**
 * Get the list of countries from the list of iso2 code
 */
function getCountries(list = []) {
  return list
    .map((countryCode) => findCountry(countryCode))
    .filter(Boolean);
}

function findCountry(iso = '') {
  return filteredCountries.value.find((country) => country.iso2 === iso.toUpperCase());
}

function findCountryByDialCode(dialCode) {
  return filteredCountries.value.find((country) => Number(country.dialCode) === dialCode);
}

function getItemClass(index, iso2) {
  const highlighted   = selectedIndex.value === index;
  const lastPreferred = index === preferredCountriesFallback.value.length - 1;
  const preferred     = preferredCountriesFallback.value.some((c) => c.toUpperCase() === iso2);

  return {
    highlighted,
    'last-preferred': lastPreferred,
    preferred,
  };
}

function choose(country) {
  let parsedCountry = country;
  if (typeof parsedCountry === 'string') {
    parsedCountry = findCountry(parsedCountry);
  }

  if (!parsedCountry) {
    return;
  }
  if (phone.value?.[0] === '+'
    && parsedCountry.iso2
    && phoneObject.value.nationalNumber) {
    activeCountryCode.value = parsedCountry.iso2;
    // Attach the current phone number with the newly selected country
    phone.value             = parsePhoneNumberFromString(
      phoneObject.value.nationalNumber,
      parsedCountry.iso2,
    )
      .formatInternational();
    return;
  }

  if (inputOptionsFallback.value?.showDialCode && parsedCountry) {
    // Reset phone if the showDialCode is set
    phone.value             = `+${parsedCountry.dialCode}`;
    activeCountryCode.value = parsedCountry.iso2 || '';
    return;
  }

  // update value, even if international mode is NOT used
  activeCountryCode.value = parsedCountry.iso2 || '';
  emitInput(phone.value);
}

function cleanInvalidCharacters() {
  const currentPhone = phone.value;
  if (validCharactersOnlyFallback.value) {
    const results = phone.value.match(/[()\-+0-9\s]*/g);
    phone.value   = results.join('');
  }

  if (customValidateFallback.value && customValidateFallback.value instanceof RegExp) {
    const results = phone.value.match(customValidateFallback.value);
    phone.value   = results.join('');
  }

  if (currentPhone !== phone.value) {
    emitInput(phone.value);
  }
}

function testCharacters() {
  if (validCharactersOnlyFallback.value) {
    const result = /^[()\-+0-9\s]*$/.test(phone.value);
    if (!result) {
      return false;
    }
  }
  if (customValidateFallback.value) {
    return testCustomValidate();
  }
  return true;
}

function testCustomValidate() {
  return customValidateFallback.value instanceof RegExp ? customValidateFallback.value.test(phone.value) : false;
}

function onInput() {
  input.value.setCustomValidity(phoneObject.value.valid ? '' : invalidMsgFallback.value);
  // Returns response.number to assign it to v-model (if being used)
  // Returns full response for cases @input is used
  // and parent wants to return the whole response.
  emitInput(phone.value);
}

function setModel(model) {
  phone.value = model;
}

function emitInput(value) {
  emits('update:modelValue', value);
  emits('on-input', value, phoneObject.value, input.value);
}

function onBlur() {
  emits('blur');
}

function onFocus() {
  setCaretPosition(input.value, phone.value.length);
  emits('focus');
}

function onEnter() {
  emits('enter');
}

function onSpace() {
  emits('space');
}

function toggleDropdown() {
  if (disabledFallback.value || dropdownOptionsFallback.value.disabled) {
    return;
  }
  open.value = !open.value;
}

function clickedOutside() {
  open.value = false;
}

function keyboardNav(e) {
  if (e.keyCode === 40) {
    // down arrow
    e.preventDefault();
    open.value = true;
    if (selectedIndex.value === null) {
      selectedIndex.value = 0;
    } else {
      selectedIndex.value = Math.min(sortedCountries.value.length - 1, selectedIndex.value + 1);
    }
    const selEle = list.value.children[selectedIndex.value] as HTMLLIElement;
    selEle.focus();
    if (selEle.offsetTop + selEle.clientHeight
      > list.value.scrollTop + list.value.clientHeight) {
      list.value.scrollTop = selEle.offsetTop
        - list.value.clientHeight
        + selEle.clientHeight;
    }
  } else if (e.keyCode === 38) {
    // up arrow
    e.preventDefault();
    open.value = true;
    if (selectedIndex.value === null) {
      selectedIndex.value = sortedCountries.value.length - 1;
    } else {
      selectedIndex.value = Math.max(0, selectedIndex.value - 1);
    }
    const selEle = list.value.children[selectedIndex.value] as HTMLLIElement;
    selEle.focus();
    if (selEle.offsetTop < list.value.scrollTop) {
      list.value.scrollTop = selEle.offsetTop;
    }
  } else if (e.keyCode === 13) {
    // enter key
    if (selectedIndex.value !== null) {
      choose(sortedCountries[selectedIndex.value]);
    }
    open.value = !open.value;
  } else {
    // typing a country's name
    typeToFindInput.value += e.key;
    clearTimeout(typeToFindTimer.value);
    typeToFindTimer.value = setTimeout(() => {
      typeToFindInput.value = '';
    }, 700);
    // don't include preferred countries, so we jump to the right place in the alphabet
    const typedCountryI  = sortedCountries.value
      .slice(preferredCountriesFallback.value.length)
      .findIndex((c) => c.name.toLowerCase().startsWith(typeToFindInput.value));
    if (typedCountryI >= 0) {
      selectedIndex.value       = preferredCountriesFallback.value.length + typedCountryI;
      const selEle             = list.value.children[selectedIndex.value] as HTMLLIElement;
      const needToScrollTop    = selEle.offsetTop < list.value.scrollTop;
      const needToScrollBottom = selEle.offsetTop + selEle.clientHeight
        > list.value.scrollTop + list.value.clientHeight;
      if (needToScrollTop || needToScrollBottom) {
        list.value.scrollTop = selEle.offsetTop - list.value.clientHeight / 2;
      }
    }
  }
}

function reset() {
  selectedIndex.value = sortedCountries.value.map((c) => c.iso2).indexOf(activeCountryCode.value);
  open.value          = false;
}

function setDropdownPosition() {
  const spaceBelow          = window.innerHeight - instance.vnode.el.getBoundingClientRect().bottom;
  const hasEnoughSpaceBelow = spaceBelow > 200;
  if (hasEnoughSpaceBelow) {
    dropdownOpenDirection.value = 'below';
  } else {
    dropdownOpenDirection.value = 'above';
  }
}

watch(activeCountry, (value, oldValue) => {
  if (!value && oldValue?.iso2) {
    activeCountryCode.value = oldValue.iso2;
    return;
  }
  if (value?.iso2) {
    emits('country-changed', value);
    // this.resetPlaceholder();
  }
});

watch(() => 'phoneObject.countryCode', (value) => {
  activeCountryCode.value = value || '';
});

watch(() => 'phoneObject.valid', () => {
  emits('validate', phoneObject.value);
});

watch(() => 'phoneObject.formatted', (value) => {
  if (!autoFormatFallback.value || customValidateFallback.value) {
    return;
  }
  emitInput(value);

  nextTick(() => {
    // In case `v-model` is not set, we need to update the `phone` to be new formatted value
    if (value && !props.modelValue) {
      phone.value = value;
    }
  });
});

watch(() => 'inputOptions.placeholder', () => {
  resetPlaceholder();
});

watch(() => props.modelValue, (value, oldValue) => {
  if (!testCharacters()) {
    nextTick(() => {
      phone.value = oldValue;
      onInput();
    });
  } else {
    phone.value = value;
  }
});

watch(open, (isDropdownOpened) => {
  // Emit open and close events
  if (isDropdownOpened) {
    setDropdownPosition();
    emits('open');
  } else {
    emits('close');
  }
});
</script>

<style src="../assets/sprite.css"></style>
<style src="../assets/component.css"></style>
