import vClickOutside from 'click-outside-vue3';
import utils, { defaultOptions } from './utils';
import VueTelInput from './components/vue-tel-input.vue';
import { InputHTMLAttributes } from 'vue';

export interface DropdownOptions {
  showFlags?: boolean;
  disabled?: boolean;
  tabindex?: number;
  showDialCodeInSelection?: boolean;
  showDialCodeInList?: boolean;
}

type Booleanish = boolean | 'true' | 'false'

export interface InputOptions extends Partial<InputHTMLAttributes> {
  type?: string;
  autocomplete?: string;
  autofocus?: boolean;
  styleClasses?: string;
  id?: string;
  maxlength?: number;
  name?: string;
  readonly?: Booleanish;
  required?: Booleanish;
  tabindex?: string;
  showDialCode?: boolean;
  placeholder?: string;
}

export interface CustomOptions {
  dropdownOptions?: DropdownOptions;
  inputOptions?: InputOptions;
  [index: string]: any;
}

VueTelInput.install = (app, customOptions: CustomOptions = {}) => {
  app.use(vClickOutside);

  const {
          dropdownOptions: customDropdownOptions,
          inputOptions: customInputOptions,
          ...otherCustomOptions
        } = customOptions;
  const {
          dropdownOptions: defaultDropdownOptions,
          inputOptions: defaultInputOptions,
          ...otherDefaultOptions
        } = defaultOptions;

  utils.options = {
    inputOptions: {
      ...defaultInputOptions,
      ...customInputOptions,
    },
    dropdownOptions: {
      ...defaultDropdownOptions,
      ...customDropdownOptions,
    },
    ...otherDefaultOptions,
    ...otherCustomOptions,
  };

  app.component('vue-tel-input', VueTelInput);
}

export default VueTelInput;
