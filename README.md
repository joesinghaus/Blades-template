# Blades in the Dark Character Sheet template

This is a template for creating a derivative of the character sheet for Blades in the Dark for use on Roll20. If you have any questions, feel free to contact me on Discord @deceptive.duality#6358.

This is the main version of this template, still containing all the Blades-specific data such as items, playbooks, crews, and factions. If you want to start from a clean sheet for a fresh hack, it is probably best to start from the [clean version](https://github.com/joesinghaus/Blades-template/tree/clean-sheet) instead, and use this branch only for insight in how to structure your data. If you want to see an example of a complete sheet created from this template, have a look at the [A Nocturne](https://github.com/joesinghaus/Blades-template/tree/A-Nocturne) branch of this repository.

## Changelog

### July 3, 2018

Switched from command line sass to node-sass. This makes installing the required dependencies a bit more intuitive.

### June 2, 2018

Apart from bugfixes, some changes made to the Blades sheet were backported to the templated version. Moreover, this template vas reset to internal version number 1.0, since a new sheet really should not start at 2.7. The following innovations of the Blades sheet were backported:

* Friend/contact notes
* Automatically filling ability description upon entering names
* Character picture on chat rolls
* Pre-calculated number of dice
* Restyled repeating section controls to use symbols instead of text

## Compiling the sheet

The sheet uses [pug](https://pugjs.org/) as a HTML preprocessor and [sass](https://sass-lang.com/) as a CSS preprocessor. This means that you need to compile the two main source code files (`Source/blades.pug` and `Source/blades.scss`) into the actual `blades.html` and `blades.css` files. It also uses Babel (via JSTransformer) to minify the Javascript code, though this is optional (read below on how to disable it if it produces problems). Once the command line interfaces for pug and sass are installed, the sheet is compiled via

```bash
node build.js
```

executed in the root directory of this code.

If you want to change the **look** of the sheet or the roll template, you should already know how CSS works: in this case, just go ahead and change the `sheet.scss` and `rolltemplate.scss` to your heart's content. Sass is an extension of CSS, so if you don't know sass, just adding CSS code will work just fine.

For changing the **content** of the sheet, you will have to make changes to the pug files (for the HTML), the `translation.json` file (for changing the actual text on the sheet), or to the `data.json` and `sheetworkers.js` files.

**If you do not feel comfortable working with pug or sass**, the `Source/uncompressed` folder contains compiled, but human-readable versions of `blades.html` and `blades.css`. Editing them is more work, however (for example for changing action names). It is highly recommended that you at least start by making changes to the .pug files instead.

**If you have made some changes in pug, e.g. action names, and want to transition to doing the rest of the editing in HTML**, you can change the `pretty` option to `true` in the build.js file. This will produce human-readable HTML/CSS for you to edit further.

### Babel problems

Sometimes the babel filter does not seem to work and produces errors. You can change `enableBabel` to `false` in the build.js file to disable it. It will have no impact on the functionality of the sheet, and it will get rid of this error.

### Installing the required components

To install all the prerequsites, install [Node.js](https://nodejs.org/en/download/), open a command prompt, and enter

```bash
npm install pug node-sass jstransformer jstransformer-babel babel-preset-minify
````

## File structure

### translation.json

The `translation.json` file contains all the text in the sheet and the roll template (set up for translation, hence the name). As indicated by the file name, the content is in JSON format, so it follows a `"key": "value"` pattern. For almost all text changes, you will have to add or change keys/values here (and you might want to remove superfluous lines, though this is optional).

### pug

The base file for the pug code that generates the HTML is `Source/blades.pug`. You will find some variables at the top of the file to change what the resulting HTML looks like. When building the sheet, this file pulls in information from the individual parts of the sheet in the `Source/pug/` folder (the names should be self-explanatory), as well the `data.json` and `sheetworkers.js` files. If you want to change a specific part of the sheet, try searching around the indivual `.pug` files to find the part you want to change (and if you cannot find it, feel free to ask me).

Any attribute that starts with "data-i18n" references a key in the translation.json variable — look it up there to find out what the specific text is (though it will often be obvious).

### Source/data.json

This file supplies the database used by the sheet worker scripts. It may look intimidatingly large at first, but most of this file is just the data for the various crews, playbooks, and factions. You will probably only have to change the data at the top of the script, not the code that comes after. Here's a short explanation of the data keys (more details in the "Common changes" section).

* **crew** is an object containing the information about the crew information that is filled in automatically when you enter a crew's name.
* **playbook** is the same as the previous one, but for playbooks instead of crews.
* **factions** is an object containing the faction information that is put into the factions sheet when "Generate Factions" is pressed.
* **actions** contains the attributes and actions.
* **traumas** contains traumas (by type).
* **items** contains the default items a character starts with.
* **translatedDefaults** contains the defaults for input fields that should be translated. This is a rather cumbersome way to make sure that you can have an input field whose value you can change, but whose default depends on your chosen translation. Unless you add more translated fields, you do not need to change this.
* **defaultValues** provides some defaults to reset attributes when you switch playbooks. It should not be necessary to edit this object, though you may do so when you change e.g. action names. Resetting should work either way.
* **alchemicals** contains the list of alchemicals that a Leech gets automatically.
* **maxFriendsPerPlaybook** and **maxContactsPerCrew** control the number of friends and contacts each playbook gets.
* **friendlessPlaybooks** should be self-explanatory.
* **translatedCrewAttributes** and **translatedPlaybookAttributes** contain those attributes of crews/playbooks that the script should look for translations for.

### Source/sheetworkers.js

This is the source code for the part of the sheet workers that actually executes code. There's a good chance that no changes will be necessary here.

### SASS

The sheet's CSS is generated from `Source/blades.scss`, which is a short file that mostly combines `Source/scss/sheet.scss` and `Source/scss/rolltemplate.scss`, whose different functions should be self-explanatory.

## Common changes

All of the text visible on the sheet and in roll templates is translated text. Most of the text on the sheet can simply be changed by changing the corresponding value in the `translation.json` file. In general, whenever you add new text to the sheet or change existing text, you will have to make changes to the `translation.json`.

### Action/attribute names

To effectively change action and/or attribute names, you need to make changes in two places. Everything except the value in the translation file should be strictly lowercase.

1. In the data.json object, change the actions property.
2. In the translation.json file, add keys for your changed actions, attributes, and their descriptions. E.g., if you want to add a "Hack" action, add the following lines:

```JSON
"hack": "Hack",
"hack_description": "Interface with machines. Manipulate computer systems, extract data, etc. (whatever your description for Hack is)",
 ```

Note that there is no need to have 3 attributes with 4 actions each, even though that is probably the case for most hacks. The code will adapt to whatever info you feed into actionData.

### Default items

In order to change the non-playbook-specific gear that every character gets, you will need to edit the `items` property in the `data.json` file. The names of items (such as "a_blade_or_two") and their descriptions (such as "a_blade_or_two_description") are translated, so make sure to also edit the `translation.json` file as well. The items are in the same order that they will appear on the sheet. The "numboxes" property controls the number of boxes, and `"short": "1"` creates an item that only takes up half a line.

### Factions

To change the factions, modify the factions property in the `data.json`. The faction names (such as "The Circle of Flame") as well the headers (such as "Underworld") are translated, so be sure to change and/or add the corresponding keys in the `translation.json` file, e.g. `"faction_the_circle_of_flame": "The Circle of Flame",` and `"factions1": "Underworld",`. You can play around with the number of faction "categories" in the faction.pug and the factions property - the numbers 1-5 in the `faction.pug` correspond to factions1-factions5 in the `data.json`.

### Logo

The game logo is on line 635 of `sheet.scss`.

### Playbooks/crews

You will have to edit both the `data.json` and the `translation.json` in order to modify playbooks/crews.

1. Modify the "crew", respectively "playbook" properties in the `data.json` object. You can use one of the standard playbooks as a template.
2. Change the translation.json to reflect any newly-added translation keys, such as for playbook contacts, items, et cetera. In particular, add the name of your new playbook, e.g. `"hacker": "Hacker",`.

Some remarks on Step 2:

* A playbook's **friends** (or a crew's **contacts**) are generated automatically from the translation.json file — hence, when you add your "Hacker" playbook, you also have to add their five hacker friends (as below). Changing the number of contacts or friends can be done by changing the maxFriendsPerPlaybook and max ContactsPerCrew properties in `data.json`.

``` JSON
"playbook_hacker_friend_0": "Jack",
"playbook_hacker_friend_1": "Sue",
...
"playbook_hacker_friend_4": "AZ-215, a sentient AI",
```

* The names of playbook items and their descriptions are pulled from the `translation.json`, so make sure to make the necessary changes there. Same for crew upgrades.

* If you (which is very likely) have new special abilities for your playbook or crew, just enter the name into the corresponding array; to add the actual data of the ability, add them to the translation.json, as detailed under "Special abilities".

* Everything about a character/crew that's *not* abilities, friends/contacts, or items/upgrades, is detailed in the "base" property. Here, you change default action dots, xp triggers, gather information questions, the names of claims, et cetera. Take a look at the existing playbooks and crews for details.

### Special abilities

In order to add or change special abilities, you need to change the translation.json file (note that adding special abilities will do nothing unless you also add or modify a playbook or crew so that it uses them). In order to do this, you need two new lines in the translation.json file for every new special ability, with keys `playbook_ability_NAME` and `playbook_ability_NAME_description` (for characters) or `crew_ability_NAME` and `crew_ability_NAME_description` (for crews). E.g:

```JSON
"playbook_ability_hedonist": "Hedonist",
"playbook_ability_hedonist_description": "When you indulge your vice, you may adjust the dice outcome by +/-2. An ally who joins you may do the same.",
```

### Traumas

To modify traumas, change the traumaData property in the `data.json`, and add any translations for new traumas to the `translation.json`.

### Upgrades

The crew upgrades are on line 249+ of the crew.pug. However, their default names and descriptions are actually translated values. To change them:

1. Change/add/delete the +makeupgrade commands in the crew.pug. The first argument (e.g. 6) is the number of the upgrade, make sure those are unique. The second argument is the number of upgrade boxes (1 or 2), after that come the translation keys for the default value and description.
2. Change the translatedDefaultValues property of `data.json` so that it reflects the upgrade numbers that exist now.
3. Add the necessary new translation keys to the `translation.json`.

In order, you might make these changes:

```
+makeupgrade(6, 1, 'racing_car', 'upgrade_racing_car_description')
...
"racing_car": "Racing Car",
"upgrade_racing_car_description": "This is a very fast car.",
```

## Specialty sections

The sheet still contains some of the more esoteric parts of the sheet, such as the strictures for vampires. While I do not expect anyone to use them as-is, they remain as a template for how to create custom special sections on the sheet. Some of them are toggled off via global variables in `blades.pug` by default.
