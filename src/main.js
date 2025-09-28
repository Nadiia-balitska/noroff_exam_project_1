window.__API_BASE__ = 'https://v2.api.noroff.dev';



import './js/utils.js';
import './js/include.js';

import './js/auth.js';

import './js/login.js';
import './js/register.js';
import './js/latest.js';
import './js/popular.js';
import './js/subscribe.js';
import './js/product.js';

import "./js/header.js";
import { initHeader } from "./js/header.js";
import { initLatest } from "./js/latest.js";
import { initPopular }  from "./js/popular.js";
  import { initProduct } from "./js/product.js";




document.addEventListener("includes:ready", () => {
  initLatest();
   initPopular();   
   initHeader();
   initProduct();
});