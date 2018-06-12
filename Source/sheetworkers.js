/* global data, getTranslationByKey, getAttrs, setAttrs, on, getSectionIDs, generateRowID, removeRepeatingRow */
const sheetVersion = "1.0";
const sheetName = "A Nocturne";
/* It's necessary to include the base data at the start of the file */
/* Translate all the data */
Object.keys(data.craft).forEach(craft => {
	const base = data.craft[craft].base;
	Object.keys(base).forEach(attr => {
		if (data.translatedCraftAttributes.includes(attr)) {
			base[attr] = getTranslationByKey(base[attr]);
		}
	});
	data.craft[craft].craftability = data.craft[craft].craftability.map(name => ({
		name: getTranslationByKey(`craft_ability_${name}`),
		description: getTranslationByKey(`craft_ability_${name}_desc`)
	}));
	data.craft[craft].upgrade.forEach(upgrade => {
		upgrade.name = getTranslationByKey(upgrade.name);
		upgrade.description = getTranslationByKey(upgrade.description);
		upgrade.boxes_chosen = '1';
	});
});
data.items.forEach(item => {
	item.boxes_chosen = '1';
	item.name = getTranslationByKey(item.name);
	item.description = getTranslationByKey(item.description) || '';
});
Object.keys(data.translatedDefaults).forEach(k => {
	data.translatedDefaults[k] = getTranslationByKey(data.translatedDefaults[k]);
});
Object.assign(data.defaultValues, data.translatedDefaults);
Object.keys(data.factions).forEach(x => {
	data.factions[x].forEach(faction => {
		faction.name = getTranslationByKey(faction.name);
	});
});
Object.keys(data.playbook).forEach(playbook => {
	const base = data.playbook[playbook].base;
	Object.keys(base).forEach(attr => {
		if (data.translatedPlaybookAttributes.includes(attr)) {
			base[attr] = getTranslationByKey(base[attr]);
		}
	});
	data.playbook[playbook].ability = data.playbook[playbook].ability.map(name => ({
		name: getTranslationByKey(`playbook_ability_${name}`),
		description: getTranslationByKey(`playbook_ability_${name}_desc`)
	}));
	data.playbook[playbook].playbookitem.forEach(item => {
		item.name = getTranslationByKey(item.name);
		item.description = getTranslationByKey(item.description);
		item.boxes_chosen = '1';
	});
});
const playbookAbilityMap = new Map([...Object.values(data.playbook).map(x => x.ability).reduce((m, v) => {
	v.forEach(a => m.add(a));
	return m;
}, new Set())].map(x => {
	return [x.name.toLowerCase(), x.description];
}));
const craftAbilityMap = new Map([...Object.values(data.craft).map(x => x.craftability).reduce((m, v) => {
	v.forEach(a => m.add(a));
	return m;
}, new Set())].map(x => {
	return [x.name.toLowerCase(), x.description];
}));
/* Utility functions - shouldn't need to touch most of these */
const mySetAttrs = (attrs, options, callback) => {
		const finalAttrs = Object.keys(attrs).reduce((m, k) => {
			m[k] = `${attrs[k]}`;
			return m;
		}, {});
		setAttrs(finalAttrs, options, callback);
	},
	setAttr = (name, value) => {
		getAttrs([name], v => {
			const setting = {};
			if (v[name] !== `${value}`) setting[name] = `${value}`;
			setAttrs(setting);
		});
	},
	fillRepeatingSectionFromData = (sectionName, dataList, autogen, callback) => {
		callback = callback || (() => {});
		getSectionIDs(`repeating_${sectionName}`, idList => {
			const existingRowAttributes = [
				...idList.map(id => `repeating_${sectionName}_${id}_name`),
				...idList.map(id => `repeating_${sectionName}_${id}_autogen`)
			];
			getAttrs(existingRowAttributes, v => {
				/* Delete auto-generated rows */
				if (autogen) {
					idList = idList.filter(id => {
						if (v[`repeating_${sectionName}_${id}_autogen`]) {
							removeRepeatingRow(`repeating_${sectionName}_${id}`);
							return false;
						}
						else return true;
					});
				}
				const existingRowNames = idList.map(id => v[`repeating_${sectionName}_${id}_name`]),
					createdIDs = [],
					setting = dataList.filter(o => !existingRowNames.includes(o.name))
					.map(o => {
						let rowID;
						while (!rowID) {
							let newID = generateRowID();
							if (!createdIDs.includes(newID)) {
								rowID = newID;
								createdIDs.push(rowID);
							}
						}
						const newAttrs = {};
						if (autogen) {
							newAttrs[`repeating_${sectionName}_${rowID}_autogen`] = '1';
						}
						return Object.keys(o).reduce((m, key) => {
							m[`repeating_${sectionName}_${rowID}_${key}`] = o[key];
							return m;
						}, newAttrs);
					})
					.reduce((m, o) => Object.assign(m, o), {});
				mySetAttrs(setting, {}, callback);
			});
		});
	},
	getRating = num => {
		if (num > 10) return 4;
		else if (num > 7) return 3;
		else if (num > 4) return 2;
		else if (num > 0) return 1;
		else return 0;
	},
	diceMagic = num => {
		const replaceEntities = string => {
			const entities = {
				'[': '#91',
				'}': '#125',
				',': '#44',
			};
			return string.replace(/[\[},]/g, c => '&' + entities[c] + ';');
		};
		const range = end => [...Array(end+1).keys()].slice(1);
		if (num > 0)
			return replaceEntities(` {{dice=${range(num).map(() => `[[d6]]`).join(", ")}}}`);
		else return replaceEntities(' {{zerodice=[[d6]], [[d6]]}}');
	},
	buildRollFormula = base => {
		return `?{@{bonusdice}|` +
			[0,1,2,3,4,5,6,-1,-2,-3].map(n => `${n},${diceMagic(n + (parseInt(base) || 0))}`).join('|') +
			'}';
	},
	buildNumdiceFormula = () => {
		return `?{${getTranslationByKey('numberofdice')}|` +
			[0, 1, 2, 3, 4 , 5, 6].map(n => `${n},${diceMagic(n)}`).join('|') +
			'}';
	},
	emptyFirstRowIfUnnamed = sectionName => {
		getSectionIDs(`repeating_${sectionName}`, idList => {
			const id = idList[0];
			getAttrs([`repeating_${sectionName}_${id}_name`], v => {
				if (!v[`repeating_${sectionName}_${id}_name`]) {
					removeRepeatingRow(`repeating_${sectionName}_${id}`);
				}
			});
		});
	},
	handleBoxesFill = (name, upToFour) => {
		on(`change:${name}1 change:${name}2 change:${name}3 change:${name}4`, event => {
			if (event.sourceType !== 'player') return;
			getAttrs([event.sourceAttribute], v => {
				const rName = event.sourceAttribute.slice(0, -1),
					setting = {};
				if (String(v[event.sourceAttribute]) === '1') {
					switch (event.sourceAttribute.slice(-1)) {
					case '4':
						setting[`${rName}3`] = 1;
						/* falls through */
					case '3':
						setting[`${rName}2`] = 1;
						/* falls through */
					case '2':
						setting[`${rName}1`] = 1;
					}
				}
				if (String(v[event.sourceAttribute]) === '0') {
					switch (event.sourceAttribute.slice(-1)) {
					case '1':
						setting[`${rName}2`] = 0;
						/* falls through */
					case '2':
						setting[`${rName}3`] = 0;
						/* falls through */
					case '3':
						if (upToFour) setting[`${rName}4`] = 0;
					}
				}
				mySetAttrs(setting);
			});
		});
	},
	calculateResistance = name => {
		getAttrs([...data.actions[name], `setting_resbonus_${name}`], v => {
			const total = data.actions[name].map(x => v[x])
				.reduce((s, c) => s + (String(c) === '0' ? 0 : 1), 0);
			setAttr(name, total);
			setAttr(`${name}_formula`, buildRollFormula(total + parseInt(v[`setting_resbonus_${name}`])));
		});
	},
	calculateProfitFormula = () => {
		getAttrs(["profit"], v => {
			setAttr("profit_formula",  buildRollFormula(getRating(parseInt(v.profit)||0)));
		});
	},
	calculateChaosFormula = (number) => {
		getAttrs([`chaos${number}`], (v) => {
			setAttr(`chaos${number}_formula`, buildRollFormula(getRating(parseInt(v[`chaos${number}`])||0)));
		});
	},
	calculateCohortDice = prefixes => {
		const sourceAttrs = [
			...prefixes.map(p => `${p}_quality`),
			...prefixes.map(p => `${p}_impaired`),
			...prefixes.map(p => `${p}_roll_formula`),
		];
		getAttrs(sourceAttrs, v => {
			const setting = {};
			prefixes.forEach(prefix => {
				const dice = (parseInt(v[`${prefix}_quality`]) || 0) - (parseInt(v[`${prefix}_impaired`]) || 0),
					formula = buildRollFormula(dice);
				if (formula !== v[`${prefix}_roll_formula`]) setting[`${prefix}_roll_formula`] = formula;
			});
			setAttrs(setting);
		});
	};
/* CONSTANTS */
const craftAttributes = [...new Set([].concat(...Object.keys(data.craft).map(x => Object.keys(data.craft[x].base))))],
	playbookAttributes = [...new Set([].concat(...Object.keys(data.playbook).map(x => Object.keys(data.playbook[x].base))))],
	watchedAttributes = new Set(craftAttributes.concat(playbookAttributes)),
	actionsFlat = [].concat(...Object.keys(data.actions).map(x => data.actions[x])),
	autoExpandFields = [
		'repeating_ability:name',
		'repeating_ability:description',
		'repeating_craftability:name',
		'repeating_craftability:description',
		'repeating_playbookitem:name',
		'repeating_upgrade:name',
		'repeating_clock:name',
		'repeating_craftclock:name',
		'repeating_factionclock:name',
		'repeating_cohort:edges',
		'repeating_cohort:flaws',
		'repeating_gadget:name',
		'xp_condition',
		'xp_condition_extra',
		'xp_condition2',
		'xp_condition3',
		'craft_xp_condition',
		'biology',
		'craft_background',
		'craft_ai',
		'background',
	],
	autogenSections = [
		'ability',
		'craftability',
		'playbookitem',
		'upgrade'
	],
	translatedNames = [...Object.keys(data.playbook), ...Object.keys(data.craft)].reduce((m, keyName) => {
		if (getTranslationByKey(keyName)) m[getTranslationByKey(keyName).toLowerCase()] = keyName;
		else m[keyName.toLowerCase()] = keyName;
		return m;
	}, {});

/* EVENT HANDLERS */
/* Set default fields when setting craft type or playbook */
on('change:craft_type change:playbook', event => {
	getAttrs(['playbook', 'craft_type', 'changed_attributes', 'setting_autofill', ...watchedAttributes], v => {
		const changedAttributes = (v.changed_attributes || '').split(','),
			sourceName = translatedNames[(event.sourceAttribute === 'craft_type' ? v.craft_type : v.playbook).toLowerCase()],
			fillBaseData = (inputData, defaultAttrNames) => {
				if (data) {
					const finalSettings = defaultAttrNames.filter(name => !changedAttributes.includes(name))
						// do not reset attributes which have been changed by the user
						.filter(name => v[name] !== (data.defaultValues[name] || ''))
						// do not set attributes if current value is equal to sheet defaults
						.reduce((m, name) => {
							m[name] = data.defaultValues[name] || '';
							return m;
						}, {});
					Object.keys(inputData).filter(name => !changedAttributes.includes(name))
						.forEach(name => (finalSettings[name] = inputData[name]));
					mySetAttrs(finalSettings);
				}
			};
		if (event.sourceAttribute === 'craft_type' ? v.craft_type : v.playbook) {
			setAttr('show_playbook_reminder', '0');
		}
		if (v.setting_autofill !== '1') return;
		if (event.sourceAttribute === 'craft_type' && sourceName in data.craft) {
			fillRepeatingSectionFromData('craftability', data.craft[sourceName].craftability, true);
			fillRepeatingSectionFromData('upgrade', data.craft[sourceName].upgrade, true);
			fillBaseData(data.craft[sourceName].base, craftAttributes);
			if(sourceName === "cannibal_craft")
				fillRepeatingSectionFromData("cohort", [{
					name: getTranslationByKey("cohort"),
					subtype: getTranslationByKey("techs"),
					type: "gang"
				}]);
		}
		if (event.sourceAttribute === 'playbook' && sourceName in data.playbook) {
			fillRepeatingSectionFromData('ability', data.playbook[sourceName].ability, true);
			fillRepeatingSectionFromData('playbookitem', data.playbook[sourceName].playbookitem, true);
			fillBaseData(data.playbook[sourceName].base, playbookAttributes);
		}
	});
});
const fillPlaybookAbility = () => {
	const prefix = 'repeating_ability';
	getAttrs([`${prefix}_name`, `${prefix}_description`], v => {
		if (!v[`${prefix}_description`]) {
			const description = playbookAbilityMap.get((v[`${prefix}_name`] || '').toLowerCase());
			if (description) setAttr(`${prefix}_description`, description);
		}
	});
};
const fillCraftAbility = () => {
	const prefix = 'repeating_craftability';
	getAttrs([`${prefix}_name`, `${prefix}_description`], v => {
		if (!v[`${prefix}_description`]) {
			const description = craftAbilityMap.get((v[`${prefix}_name`] || '').toLowerCase());
			if (description) setAttr(`${prefix}_description`, description);
		}
	});
};
on('change:repeating_ability:name', fillPlaybookAbility);
on('change:repeating_craftability:name', fillCraftAbility);
/* Watch repeating rows for changes and set autogen to false if change happens */
autogenSections.forEach(sectionName => {
	on(`change:repeating_${sectionName}`, event => {
		getAttrs([`repeating_${sectionName}_autogen`], v => {
			if (v[`repeating_${sectionName}_autogen`] && event.sourceType === 'player') {
				setAttr(`repeating_${sectionName}_autogen`, '');
			}
		});
	});
});
/* Watch for changes in auto-set attributes and update changed_attributes*/
watchedAttributes.forEach(name => {
	on(`change:${name}`, event => {
		if (event.sourceType === 'player') {
			getAttrs(['changed_attributes'], v => {
				const changedAttributes = [...new Set(v.changed_attributes.split(',')).add(name)]
					.filter(x => !!x).join(',');
				setAttr('changed_attributes', changedAttributes);
			});
		}
	});
});
/* Register attribute/action event handlers */
Object.keys(data.actions).forEach(attrName => {
		on([...data.actions[attrName], `setting_resbonus_${attrName}`]
			.map(x => `change:${x}`).join(' '), () => calculateResistance(attrName)
		);
});
/* Calculate trauma */
["", "craft_"].forEach(p => {
	on(data.traumas.map(x => `change:${p}trauma_${x}`).join(' '), event => {
		getAttrs(data.traumas.map(x => `${p}trauma_${x}`), v => {
			if (event.sourceType === 'player') {
				const newTrauma = data.traumas.reduce((m, name) => m + (parseInt(v[`${p}trauma_${name}`]) || 0), 0);
				setAttr(`${p}trauma`, newTrauma);
			}
		});
	});
});
/* Generate buttons */
on('change:generate_factions', () => {
	setAttr('show_faction_generatebutton', '0');
	Object.keys(data.factions).forEach(sectionName => {
		fillRepeatingSectionFromData(sectionName, data.factions[sectionName]);
	});
});
autogenSections.forEach(sectionName => {
	on(`change:generate_${sectionName}`, () => {
		getAttrs(['generate_source_character', 'generate_source_craft', 'sheet_type'], v => {
			const dataVar = (v.sheet_type === 'character') ? data.playbook : data.craft,
				genSource = v[`generate_source_${v.sheet_type}`];
			if (genSource in dataVar) {
				emptyFirstRowIfUnnamed(sectionName);
				fillRepeatingSectionFromData(sectionName, dataVar[genSource][sectionName]);
			}
		});
	});
});
/* Extra trauma */
on('change:setting_extra_trauma', event => setAttr('trauma_max', 4 + (parseInt(event.newValue) || 0)));
on("change:profit", calculateProfitFormula);
[1,2,3,4,5,6,7].forEach(number => on(`change:chaos${number}`, () => calculateChaosFormula(number)));

/* Calculate cohort quality */
on('change:repeating_cohort', () => calculateCohortDice(['repeating_cohort']));
on('change:char_cohort_quality change:char_cohort_impaired change:setting_show_cohort', () => {
	getAttrs(['char_cohort_quality', 'char_cohort_impaired'], v => {
		const dice = (parseInt(v.char_cohort_quality) || 0) - (parseInt(v.char_cohort_impaired) || 0);
		setAttr('char_cohort_roll_formula', buildRollFormula(dice));
	});
});
/* Set correct verb for cohort roll button */
['char_cohort', 'repeating_cohort'].forEach(prefix => {
	const eventString = 'change:' + ((prefix === 'repeating_cohort') ? `${prefix}:type` : `${prefix}_type`);
	on(eventString, event => {
		const verb = (event.newValue === 'expert') ? '^{rolls_their}' : '^{roll_their}';
		setAttr(`${prefix}_verb`, verb);
	});
});
/* Left-fill checkboxes */
handleBoxesFill('upgrade_mastery_check_', true);
handleBoxesFill('utility_belt1_check_');
handleBoxesFill('utility_belt2_check_');
['item', 'playbookitem', 'upgrade'].forEach(sName => handleBoxesFill(`repeating_${sName}:check_`));

/* Pseudo-radios */
actionsFlat.forEach(name => {
	on(`change:${name}`, event => {
		if (String(event.newValue) === '0' && event.sourceType === 'player') {
			setAttr(name, (parseInt(event.previousValue) || 1) - 1);
		}
		setAttr(`${name}_formula`, buildRollFormula(event.newValue || '0'));
	});
});
/* Item reset button */
on('change:reset_items', () => {
	const clearChecks = sectionName => {
		getSectionIDs(`repeating_${sectionName}`, idArray => {
			const setting = [
				...idArray.map(id => `repeating_${sectionName}_${id}_check_1`),
				...idArray.map(id => `repeating_${sectionName}_${id}_check_2`),
				...idArray.map(id => `repeating_${sectionName}_${id}_check_3`)
			].reduce((m, name) => {
				m[name] = 0;
				return m;
			}, {});
			mySetAttrs(setting);
		});
	};
	setAttr('load', 0);
	['item', 'playbookitem'].forEach(clearChecks);
});
on('change:setting_consequence_query sheet:opened', () => {
	getAttrs(['setting_consequence_query'], v => {
		const consequenceQuery = (String(v.setting_consequence_query) === '1') ?
			`?{${getTranslationByKey('consequence')}|${getTranslationByKey('a_consequence')}}` :
			'^{a_consequence}';
		setAttr('consequence_query', consequenceQuery);
	});
});
/* Trim whitespace in auto-expand fields */
autoExpandFields.forEach(name => {
	on(`change:${name}`, event => {
		const attrName = name.replace(':', '_');
		getAttrs([attrName], v => {
			if (v[attrName].trim() !== v[attrName] && event.sourceType === 'player') {
				setAttr(attrName, v[attrName].trim());
			}
		});
	});
});
/* Clean chat image URL */
on('change:chat_image', event => {
	const match = (event.newValue || '').match(/^(https:\/\/s3\.amazonaws\.com\/files\.d20\.io\/images\/.*\.jpg)\?\d+$/);
	if (match) setAttr('chat_image', match[1]);
});
/* Number of dice prompt */
on('sheet:opened', () => {
	/* Set up translated attributes */
	const translatedAttrs = {
		bonusdice: getTranslationByKey('bonusdice'),
		effect_query: getTranslationByKey('effect_query'),
		notes_query: `?{${getTranslationByKey('notes')}}`,
		numberofdice: buildNumdiceFormula(),
		position_query: `?{${getTranslationByKey('position')}|` +
			`${getTranslationByKey('risky')},position=${getTranslationByKey('risky')}|` +
			`${getTranslationByKey('controlled')},position=${getTranslationByKey('controlled')}|` +
			`${getTranslationByKey('desperate')},position=${getTranslationByKey('desperate')}|` +
			`${getTranslationByKey('fortune_roll')},position=}`,
	};
	getAttrs(Object.keys(translatedAttrs), v => {
		const setting = {};
		Object.keys(translatedAttrs).forEach(name => {
			if (v[name] !== translatedAttrs[name]) setting[name] = translatedAttrs[name];
		});
		mySetAttrs(setting);
	});
});
/* INITIALISATION AND UPGRADES */
on('sheet:opened', () => {
	getAttrs(['sheet_type', 'changed_attributes', 'craft_type', 'playbook'], v => {
		/* Make sure sheet_type is never 0 */
		if (!['craft', 'faction'].includes(v.sheet_type)) setAttr('sheet_type', 'character');
		/* Remove reminder box if we have playbook or craft name */
		if (v.playbook || v.craft_type) setAttr('show_playbook_reminder', '0');
	});
	/* Setup and upgrades */
	getAttrs(['version'], v => {
		const upgradeSheet = version => {
				// const [major, minor] = version && version.split('.').map(x => parseInt(x));
				console.log(`Found version ${version}.`);
			},
			initialiseSheet = () => {
				const setting = ['ability', 'friend', 'craftability', 'contact', 'playbookitem', 'upgrade', 'framefeature']
					.reduce((memo, sectionName) => {
						memo[`repeating_${sectionName}_${generateRowID()}_autogen`] = 1;
						return memo;
					}, {});
				mySetAttrs(setting);
				fillRepeatingSectionFromData('item', data.items);
				/* Set translated default values */
				getAttrs(Object.keys(data.translatedDefaults), v => {
					const setting = {};
					Object.keys(data.translatedDefaults).forEach(k => {
						if (v[k] !== data.translatedDefaults[k]) setting[k] = data.translatedDefaults[k];
					});
					mySetAttrs(setting);
				});
				console.log('Initialising new sheet.');
			};
		if (v.version) upgradeSheet(v.version);
		else initialiseSheet();
		// Set version number
		mySetAttrs({
			version: sheetVersion,
			character_sheet: `${sheetName} v${sheetVersion}`,
		});
	});
});
