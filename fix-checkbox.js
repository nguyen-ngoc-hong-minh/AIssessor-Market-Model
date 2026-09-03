const fs = require('fs');
let css = fs.readFileSync('app/globals.css', 'utf-8');

const newCSS = css.replace(/\/\* 6\. Checkboxes.*?content: "✔";.*?font-size: 14px;\n\}/s, `/* 6. Checkboxes (Exact Match) */
input[type="checkbox"], .cl-checkbox__input {
  appearance: none !important;
  -webkit-appearance: none !important;
  background-color: transparent !important;
  border: 2px solid #0213B0 !important;
  border-radius: 0.25rem !important;
  width: 1.25rem !important;
  height: 1.25rem !important;
  cursor: pointer;
  position: relative;
  display: inline-block;
  vertical-align: middle;
  margin: 0 !important;
}

/* Hide Clerk's default checkmark SVGs */
.cl-checkbox__input ~ svg,
.cl-checkbox__mark {
  display: none !important;
}

/* Checked state: Solid blue fill */
input[type="checkbox"]:checked, .cl-checkbox__input:checked {
  background-color: #0213B0 !important;
  border-color: #0213B0 !important;
}

/* Custom Checkmark using CSS borders */
input[type="checkbox"]:checked::after, .cl-checkbox__input:checked::after {
  content: "";
  position: absolute;
  top: 40%;
  left: 50%;
  width: 6px;
  height: 11px;
  border: solid #FFFFF1;
  border-width: 0 2px 2px 0;
  transform: translate(-50%, -50%) rotate(45deg);
}`);

fs.writeFileSync('app/globals.css', newCSS);
