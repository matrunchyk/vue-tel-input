# vue3-tel-input

International Telephone Input with Vue.

[![](https://img.shields.io/npm/dt/vue3-tel-input.svg)](https://www.npmjs.com/package/vue3-tel-input) [![](https://img.shields.io/github/stars/matrunchyk/vue3-tel-input.svg)](https://github.com/matrunchyk/vue3-tel-input)

<p>
<img width="600px" alt="In-action GIF" src="https://thumbs.gfycat.com/EducatedPoliteBluefintuna-size_restricted.gif"/>
</p>

## Documentation and live demo

[Visit the website](https://iamstevendao.github.io/vue-tel-input/)

## Getting started

- Install the plugin:

  ```sh
  npm install @matrunchyk/vue3-tel-input
  ```

- Add the plugin into your app:

  ```javascript
  import Vue from 'vue'
  import VueTelInput from 'vue3-tel-input'
  import 'vue3-tel-input/dist/style.css'

  Vue.use(VueTelInput)
  ```

  [More info on installation](#installation)

- Use the `vue-tel-input` component:

  ```html
  <template>
    <vue-tel-input v-model="phone"></vue-tel-input>
  <template>
  ```

## Installation

### npm

```bash
  npm install @matrunchyk/vue-tel-input
```

Install the plugin into Vue:

```javascript
import Vue from 'vue'
import VueTelInput from '@matrunchyk/vue3-tel-input'
import '@matrunchyk/vue3-tel-input/dist/style.css'

Vue.use(VueTelInput, options) // Define default global options here (optional)
```

> View all available options in [Props](https://iamstevendao.github.io/vue-tel-input/documentation/props.html).

Or use the component directly:

```html
<!-- your-component.vue-->
<template>
  <vue-tel-input v-model="value"></vue-tel-input>
</template>
<script>
import { VueTelInput } from '@matrunchyk/vue3-tel-input'

export default {
  components: {
    VueTelInput,
  },
};

```

## Changelog

[Go to Github Releases](https://github.com/iamstevendao/vue-tel-input/releases)

## Development

Clone the project

```bash
  git clone https://github.com/iamstevendao/vue-tel-input.git
```

Go to the project directory & checkout the `next` branch

```bash
  cd vue-tel-input
  git checkout next origin/next
```

Install dependencies

```bash
  npm install
```

Build the project

```bash
  npm run build
```

Start the es build example

```bash
  npm run dev
```

Start the browser build example

```bash
  npx http-server -p 8080
  # 127.0.0.1:8080/examples/browser.html
```

## License

Copyright (c) 2022 Serhii Matrunchyk.
Copyright (c) 2018 Steven Dao.
Released under the [MIT License](https://github.com/iamstevendao/vue-tel-input/blob/master/LICENSE).

made with &#x2764; by [Steven](https://github.com/iamstevendao).
