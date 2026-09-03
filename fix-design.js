const fs = require('fs');
let css = fs.readFileSync('app/globals.css', 'utf-8');

// 1. Remove all box-shadows and transitions globally.
// We'll append a very aggressive block at the end.
const appended = `
/* ==========================================================================
   STRICT DESIGN SYSTEM ENFORCEMENT - PASS 2
   ========================================================================== */

/* Absolute Global Resets */
*, *::before, *::after {
  box-shadow: none !important;
  transition: none !important;
}

/* Kill all hover scaling/translating */
*:hover, *:active, *:focus {
  box-shadow: none !important;
  transition: none !important;
  transform: none; /* Removed !important to allow structural transforms like translate(-50%) to stay, but it will break hover transforms if we just remove the hover pseudo class */
}

/* Let's specifically kill known hover transforms by overriding them */
.trial-primary-button:hover,
.signed-home-option:hover,
.trial-model-choice:hover,
.menu-btn:hover,
.trial-secondary-button:hover,
.signed-home-history:hover {
  transform: none !important;
}

/* Default Box Roundness: The user wants almost everything to be 0.25rem except input fields */
/* Let's apply it broadly to structural UI elements */
div, section, article, nav, header, footer, dialog, aside, main, button, fieldset, .info-tip > div, .trial-progress span, .trial-progress i, .trial-progress.result span, .trial-progress.result i, .monthly-task-card, .trial-model-choice, .signed-home-option, .trial-choice-grid {
  border-radius: 0.25rem !important;
}

/* Enforce Type 3 for input fields (Round = 0) */
input:not([type="checkbox"]):not([type="radio"]), 
textarea, 
select,
.trial-form input,
.trial-form textarea,
.trial-form select,
.cl-formFieldInput {
  background-color: #F4F7F5 !important;
  border: none !important;
  border-bottom: 1px solid #0213B0 !important;
  border-radius: 0px !important;
  color: #0213B0 !important;
  padding: 12px 16px !important;
  outline: none !important;
}

/* Ensure Tooltips are Type 2 (No shadow, Border, 0.25rem) */
.info-tip > div {
  background-color: #FFFFF1 !important;
  border: 1px solid #0213B0 !important;
  color: #0213B0 !important;
  box-shadow: none !important;
  border-radius: 0.25rem !important;
}

/* Fix Progress Steps (Image 2) */
.trial-progress span {
  background-color: transparent !important;
  border: 1px solid #0213B0 !important;
  color: #0213B0 !important;
  border-radius: 0.25rem !important;
  width: 32px !important;
  height: 32px !important;
}
.trial-progress span.active, .trial-progress span.done {
  background-color: #0213B0 !important;
  border: none !important;
  color: #FFFFF1 !important;
}
.trial-progress i {
  background-color: #0213B0 !important;
  height: 1px !important; /* Make it a thin line instead of a box */
}

/* Fix Tab Switcher / Choice Grid (Image 3) */
.trial-form .trial-choice-grid {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  gap: 1.125rem !important;
}
.trial-form .trial-choice-grid button {
  margin: 0 !important;
}
`;

fs.appendFileSync('app/globals.css', appended);
