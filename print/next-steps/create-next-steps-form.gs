/**
 * Creates the ECC "Next steps" Google Form, plus a Google Sheet that collects
 * the answers. Run it once, from the Google account that should own both.
 *
 * How:
 *   1. Go to https://script.google.com and press "New project".
 *   2. Delete the sample code, paste this whole file, press Save.
 *   3. Pick "createNextStepsForm" in the function menu and press Run.
 *   4. Approve the permissions when Google asks (it needs Forms and Sheets).
 *   5. Open "Execution log": it prints the form link and the sheet link.
 *
 * Then send the "FORM LINK (paste into the website)" line to the developer,
 * and share the sheet with the person who follows up on responses.
 *
 * The next steps people can tick are a draft: change NEXT_STEPS below before
 * running, or edit them in the form afterwards.
 */

var NEXT_STEPS = [
  "I'm new and want to know more",
  "Join a life group",
  "Serve on a team",
  "Prayer for me or my family",
];

function createNextStepsForm() {
  var form = FormApp.create("Your next step · Evergreen City Community");

  form.setDescription(
    "We're so glad you were with us. Tell us where you'd like to go from here, " +
      "and someone from ECC will message you on WhatsApp within 48 hours. " +
      "We only use your details to follow up on the step you choose."
  );
  form.setConfirmationMessage("Thank you! Someone from ECC will message you on WhatsApp within 48 hours.");
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false); // no Google sign-in needed
  form.setShowLinkToRespondAgain(false);
  form.setProgressBar(false);

  form
    .addTextItem()
    .setTitle("Your name")
    .setRequired(true);

  form
    .addTextItem()
    .setTitle("Your WhatsApp number")
    .setHelpText("With country code, e.g. +91 98765 43210. We will contact you on WhatsApp.")
    .setRequired(true);

  form
    .addCheckboxItem()
    .setTitle("Which next step would you like to take?")
    .setHelpText("Tick as many as you like.")
    .setChoiceValues(NEXT_STEPS)
    .showOtherOption(true)
    .setRequired(true);

  form
    .addParagraphTextItem()
    .setTitle("Anything you'd like us to know? (optional)")
    .setRequired(false);

  // The answers land in a Google Sheet that one named person checks.
  var sheet = SpreadsheetApp.create("ECC Next steps: responses");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  Logger.log("FORM LINK (paste into the website): " + form.getPublishedUrl());
  Logger.log("Edit the form: " + form.getEditUrl());
  Logger.log("Responses sheet (share with the follow-up person): " + sheet.getUrl());
}
