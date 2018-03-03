# Blades in the Dark Character Sheet template

This is a template for creating a derivative of the character sheet for Blades in the Dark for use on Roll20. If you have any questions, feel free to contact me on Discord @deceptive.duality#6358.

## Compiling the sheet
The sheet uses [pug](https://pugjs.org/) as a HTML preprocessor and [SCSS](https://sass-lang.com/) as a SCSS preprocessor. This means that you need to compile the two main source code files (`Source/blades.pug` and `Source/blades.scss`) into the actual `blades.html` and `blades.css` files. It also uses Babel (via JSTransformer) to minify the Javascript code, though this is optional — if you do not want to deal with installing the Babel-related modules, just change line 208 in `blades.pug` to `include sheetworkers.js`. Once the command line interfaces for pug and SCSS are installed, the sheet is compiled via

```
pug -o . Source/blades.pug
scss --sourcemap=none --no-cache --style compressed Source/blades.scss blades.css
```

executed in the root directory of this code.

If you want to change the **look** of the sheet or the roll template, you should already know how CSS works: in this case, just go ahead and change the `sheet.scss` and `rolltemplate.scss` to your heart's content. SCSS is an extension of CSS, so if you don't know SCSS, just adding CSS code will work just fine.

For changing the **content** of the sheet, you will have to make changes to the pug files (for the HTML), the `translation.json` file (for changing the actual text on the sheet), or to the `sheetworkers.js` file.

**If you do not feel comfortable working with pug or SCSS**, the `Source/uncompressed` folder contains compiled, but human-readable versions of `blades.html` and `blades.css`. Editing them is more work, however (for example for changing action names). It is highly recommended that you at least start by making changes to the .pug files instead.

### Installing pug
Don't be afraid, this is simple! To install all the prerequsites, install [Node.js](https://nodejs.org/en/download/), open a command prompt, and enter

```
npm install -g pug pug-cli jstransformer-babel babel-cli babel-preset-minify
````

### Installing SCSS
This is similarly simple. First install Ruby, then open a command prompt and enter `gem install sass`.

## File structure

### translation.json
The `translation.json` file contains all the text in the sheet and the roll template (set up for translation, hence the name). As indicated by the file name, the content is in JSON format, so it follows a `"key": "value"` pattern. For almost all text changes, you will have to add or change keys/values here (and you might want to remove superfluous lines, though this is optional).

### pug

The base file for the pug code that generates the HTML is `Source/blades.pug`. You will find some variables at the top of the file to change what the resulting HTML looks like, such as the actionData variable. When building the sheet, this file pulls in information from the individual parts of the sheet in the `Source/pug/` folder (the names should be self-explanatory), as well the `sheetworkers.js`. If you want to change a specific part of the sheet, try searching around the indivual `.pug` files to find the part you want to change (and if you don't find it, feel free to ask me).

Any attribute that starts with "data-i18n" references a key in the translation.json variable — look it up there to find out what the specific text is (though it will often be obvious).

### Source/sheetworkers.js
This file is the Javascript code for the sheet's sheet worker scripts. It may look intimidatingly large at first, but most of this file is just the data for the various crews, playbooks, and factions. You will probably only have to change the data at the top of the script, not the code that comes after. Here's a short explanation of the data variables (more details in the "Common changes" section).

* **crewData** is an object containing the information about the crew information that is filled in automatically when you enter a crew's name.
* **playbookData** is the same as the previous one, but for playbooks instead of crews.
* **factionsData** is an object containing the faction information that is put into the factions sheet when "Generate Factions" is pressed.
* **actionData** contains the attributes and actions.
* **traumaData** contains traumas (by type).
* **itemData** contains the default items a character starts with.
* **translatedDefaults** contains the defaults for input fields that should be translated. This is a rather cumbersome way to make sure that you can have an input field whose value you can change, but whose default depends on your chosen translation. As an example, look at the XP trigger "You struggled with issued from your vice or traumas." whose attribute is "xp_condition2". The default value on the sheet is "You struggled with issued from your vice or traumas.". However, there's also an entry `xp_condition2: "xp_beliefs",` in the **translatedDefaults** object. A script will pull the value of "xp_beliefs" from the `translation.json` and compare it to the value of the input on the sheet on a newly-created sheet. If they differ, it will put the translated value into the sheet instead. The upshot of this is the following: if you create a new input with a default value that should be translated, you should add the data to this object for it to work properly. If you change one of the existing defaults for one of these fields (such as one of the xp triggers), it is best practice to change it *both* in the translation file and change the default in the pug/HTML — you do *not* need to change the **translatedDefaults** object in this case, since it pulls all the values from the translation file automatically.
* **defaultValues** provides some defaults to reset attributes when you switch playbooks. It should not be necessary to edit this object, though you may do so when you change e.g. action names. Resetting should work either way.
* **alchemicalData** contains the list of alchemicals that a Leech gets automatically (line 1582 is responsible for doing this).

### SCSS
The sheet's CSS is generated from `Source/blades.scss`, which is a short file that mostly combines `Source/scss/sheet.scss` and `Source/scss/rolltemplate.scss`, whose different functions should be self-explanatory.

## Common changes
All of the text visible on the sheet and in roll templates is translated text. Most of the text on the sheet can simply be changed by changing the corresponding value in the `translation.json` file. In general, whenever you add new text to the sheet or change existing text, you will have to make changes to the `translation.json`.

### Action/attribute names
To effectively change action and/or attribute names, you need to make changes in three places. Everything except the value in the translation file should be strictly lowercase.

1. At the top of the blades.pug file, in the actionData object (lines 2-4)
2. In the sheetworkers.js file, in the actionData object (lines 1066-1070, same as the one in the first step), and optionally in the defaultValues object on line 1214+ (e.g. add a line `hack: "0",`)
3. In the translation.json file, add keys for your changed actions, attributes, and their descriptions. E.g., if you want to add a "Hack" action, add the following lines:

```
"hack": "Hack",
"hack_description": "Interface with machines. Manipulate computer systems, extract data, etc. (whatever your description for Hack is)",
 ```

Note that there is no need to have 3 attributes with 4 actions each, even though that is probably the case for most hacks. The code will adapt to whatever info you feed into actionData.

### Default items

In order to change the non-playbook-specific gear that every character gets, you will need to edit the `itemData` array in the `sheetworkers.js` file. The names of items (such as "a_blade_or_two") and their descriptions (such as "a_blade_or_two_description") are translated, so make sure to also edit the `translation.json` file as well. The items are in the same order that they will appear on the sheet. The "numboxes" property controls the number of boxes, and `"short": "1"` creates an item that only takes up half a line.

### Factions
To change the factions, modify the factionsData object in the `sheetworkers.js`. The faction names (such as "The Circle of Flame") as well the headers (such as "Underworld") are translated, so be sure to change and/or add the corresponding keys in the `translation.json` file, e.g. `"faction_the_circle_of_flame": "The Circle of Flame",` and `"factions1": "Underworld",`. You should also change the header in the corresponding line of  `faction.pug` (line 27+). You can play around with the number of faction "categories" in the faction.pug and the factionsData object - the numbers 1-5 in the `faction.pug` correspond to factions1-factions5 in the `sheetworkers.js`.

### Logo
The game logo is on line 635 of `sheet.scss`.

### Playbooks/crews
You will have to edit both the `sheetworkers.js` and the `translation.json` in order to modify playbooks/crews.

1. Add your changed playbook name to the `translation.json` file, e.g. `"hacker": "Hacker",`.
2. Modify the crewData, respectively playbookData, object in the `sheetworkers.js` file. You can use one of the standard playbooks as a template; importantly, use the same key for your playbook that you used in the translation file earlier (keeping lowercase names for everything).
3. Change the translation.json to reflect any newly-added translation keys, such as for playbook contacts, items, et cetera.

Some remarks on Step 2:
* A playbook's **friends** (or a crew's **contacts**) are generated automatically from the translation.json file — hence, when you add your "Hacker" playbook, you also have to add their five hacker friends (as below). Changing the number of contacts or friends can be done on line 1292 (contacts) and 1349 (friends) of the `sheetworkers.js`.
```
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

```
"playbook_ability_hedonist": "Hedonist",
"playbook_ability_hedonist_description": "When you indulge your vice, you may adjust the dice outcome by +/-2. An ally who joins you may do the same.",
```

### Traumas
To modify traumas, change the traumaData variable at the beginning of `blades.pug`, the traumaData variable in `sheetworkers.js`, and add translations for any newly-added traumas.

### Upgrades
The crew upgrades are on line 234+ of the crew.pug. However, their default names and descriptions are actually translated values, making changes here somewhat complicated. Let's assume you are changing the "Carriage" upgrade to a 1-box upgrade 'Racing car', then you have to do these things:

1. Change line 249 in `crew.pug` to your desired default. The '6' is the number of the upgrade (make sure this is distinct for all different upgrades), the 2 is the number of boxes in front of the name. The other arguments are the default name and default description.
2. Change line 1176-1177 of the `sheetworkers.js` to your new translation key and its associated description.
3. Actually add the translation keys to the `translation.json`.

In order, you might make these changes to the three files:
```
+makeupgrade(6, 1, 'Racing Car', 'This is a very fast car.')
...
upgrade_6_name: "racing_car",
upgrade_6_description: "upgrade_racing_car_description",
...
"racing_car": "Racing Car",
"upgrade_racing_car_description": "This is a very fast car.",
```

## Specialty sections
The sheet still contains some of the more esoteric parts of the sheet, such as the strictures for vampires. While I do not expect anyone to use them as-is, they remain as a template for how to create custom special sections on the sheet.
