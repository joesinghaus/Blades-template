/* global data, getTranslationByKey, getAttrs, setAttrs, on, getSectionIDs, generateRowID, removeRepeatingRow */
const sheetVersion = "1.0";
const sheetName = "Blades in the Dark";
const getTranslation = (key) => (getTranslationByKey(key) || "NO_TRANSLATION_FOUND");
/* It's necessary to include the base data at the start of the file */
/* Translate all the data */
Object.keys(data.crew).forEach(crew => {
	const base = data.crew[crew].base;
	Object.keys(base).forEach(attr => {
		if (data.translatedCrewAttributes.includes(attr)) {
			base[attr] = getTranslation(base[attr]);
		}
	});
	/* Generate crew contacts from translation file */
	data.crew[crew].contact = [...Array(data.maxContactsPerCrew).keys()].map(i => ({
		name: getTranslation(`crew_${crew}_contact_${i}`)
	}));
	data.crew[crew].crewability = data.crew[crew].crewability.map(name => ({
		name: getTranslation(`crew_ability_${name}`),
		description: getTranslation(`crew_ability_${name}_description`)
	}));
	data.crew[crew].upgrade.forEach(upgrade => {
		upgrade.name = getTranslation(upgrade.name);
		if (upgrade.description) {
			upgrade.description = getTranslationByKey(upgrade.description) || "";
		}
		upgrade.boxes_chosen = "1";
	});
});
data.items.forEach(item => {
	item.boxes_chosen = "1";
	item.name = getTranslation(item.name);
	item.description = getTranslationByKey(item.description) || "";
});
Object.keys(data.translatedDefaults).forEach(k => {
	data.translatedDefaults[k] = getTranslation(data.translatedDefaults[k]);
});
Object.assign(data.defaultValues, data.translatedDefaults);
Object.keys(data.factions).forEach(x => {
	data.factions[x].forEach(faction => {
		faction.name = getTranslation(faction.name);
	});
});
data.alchemicals.forEach((v, k) => {
	data.alchemicals[k] = {
		name: getTranslation(v)
	};
});
Object.keys(data.playbook).forEach(playbook => {
	const base = data.playbook[playbook].base;
	Object.keys(base).forEach(attr => {
		if (data.translatedPlaybookAttributes.includes(attr)) {
			base[attr] = getTranslation(base[attr]);
		}
	});
	/* Generate playbook friends from translation file */
	if (!data.friendlessPlaybooks.includes(playbook)) {
		data.playbook[playbook].friend = [...Array(data.maxFriendsPerPlaybook).keys()]
			.map(i => ({
				name: getTranslation(`playbook_${playbook}_friend_${i}`)
			}))
			.filter(o => o.name);
	}
	else data.playbook[playbook].friend = [];
	data.playbook[playbook].ability = data.playbook[playbook].ability.map(name => ({
		name: getTranslation(`playbook_ability_${name}`),
		description: getTranslation(`playbook_ability_${name}_description`)
	}));
	data.playbook[playbook].playbookitem.forEach(item => {
		item.name = getTranslation(item.name);
		if (item.description) {
			item.description = getTranslationByKey(item.description) || "";
		}
		item.boxes_chosen = "1";
	});
});
const playbookAbilityMap = new Map([...Object.values(data.playbook).map(x => x.ability).reduce((m, v) => {
	v.forEach(a => m.add(a));
	return m;
}, new Set())].map(x => {
	return [x.name.toLowerCase(), x.description];
}));
const crewAbilityMap = new Map([...Object.values(data.crew).map(x => x.crewability).reduce((m, v) => {
	v.forEach(a => m.add(a));
	return m;
}, new Set())].map(x => {
	return [x.name.toLowerCase(), x.description];
}));
/* Utility functions - shouldn't need to touch most of these */
const mySetAttrs = (attrs, options, callback) => {
		const finalAttrs = Object.keys(attrs).reduce((m, k) => {
			m[k] = String(attrs[k]);
			return m;
		}, {});
		setAttrs(finalAttrs, options, callback);
	},
	setAttr = (name, value) => {
		getAttrs([name], v => {
			const setting = {};
			if (v[name] !== String(value)) setting[name] = String(value);
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
								newAttrs[`repeating_${sectionName}_${rowID}_autogen`] = "1";
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
	diceMagic = num => {
		const range = end => [...Array(end + 1).keys()].slice(1);
		if (num > 0) return `dice=${range(num).map(() => "[[d6]]").join("&"+"#44"+"; ")}`;
		else return "zerodice=[[d6]]&"+"#44"+"; [[d6]]";
	},
	buildRollFormula = base => {
		return ` {{?{@{bonusdice}|${
			[0, 1, 2, 3, 4, 5, 6, -1, -2, -3].map(n => `${n},${diceMagic(n + (parseInt(base) || 0))}`).join("|")
		}}}}`;
	},
	buildNumdiceFormula = () => {
		return ` {{?{${getTranslation("numberofdice")}|${
			[0, 1, 2, 3, 4, 5, 6].map(n => `${n},${diceMagic(n)}`).join("|")
		}}}}`;
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
			if (event.sourceType !== "player") return;
			getAttrs([event.sourceAttribute], v => {
				const rName = event.sourceAttribute.slice(0, -1),
					setting = {};
				if (String(v[event.sourceAttribute]) === "1") {
					switch (event.sourceAttribute.slice(-1)) {
					case "4":
						setting[`${rName}3`] = 1;
						/* falls through */
					case "3":
						setting[`${rName}2`] = 1;
						/* falls through */
					case "2":
						setting[`${rName}1`] = 1;
					}
				}
				if (String(v[event.sourceAttribute]) === "0") {
					switch (event.sourceAttribute.slice(-1)) {
					case "1":
						setting[`${rName}2`] = 0;
						/* falls through */
					case "2":
						setting[`${rName}3`] = 0;
						/* falls through */
					case "3":
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
				.reduce((s, c) => s + (String(c) === "0" ? 0 : 1), 0);
			setAttr(name, total);
			setAttr(`${name}_formula`, buildRollFormula(total + parseInt(v[`setting_resbonus_${name}`])));
		});
	},
	calculateVice = () => {
		getAttrs(Object.keys(data.actions), v => {
			const total = Math.min(...Object.keys(v).map(x => parseInt(v[x]) || 0));
			setAttr("vice_formula", buildRollFormula(total));
		});
	},
	calculateStashFormula = () => getAttrs(["stash"], v => {
		setAttr("stash_formula", buildRollFormula(Math.floor(parseInt(v.stash) / 10)));
	}),
	calculateWantedFormula = () => getAttrs(["wanted"], v => {
		setAttr("wanted_formula", buildRollFormula(v.wanted));
	}),
	calculateCohortDice = prefixes => {
		const sourceAttrs = [
			"crew_tier",
			...prefixes.map(p => `${p}_impaired`),
			...prefixes.map(p => `${p}_type`),
			...prefixes.map(p => `${p}_roll_formula`),
		];
		getAttrs(sourceAttrs, v => {
			const setting = {};
			prefixes.forEach(prefix => {
				const dice = (parseInt(v.crew_tier) || 0) - (parseInt(v[`${prefix}_impaired`]) || 0) +
						((v[`${prefix}_type`] === "elite" || v[`${prefix}_type`] === "expert") ? 1 : 0),
					formula = buildRollFormula(dice);
				if (formula !== v[`${prefix}_roll_formula`]) setting[`${prefix}_roll_formula`] = formula;
			});
			setAttrs(setting);
		});
	};
/* CONSTANTS */
const crewAttributes = [...new Set([].concat(...Object.keys(data.crew).map(x => Object.keys(data.crew[x].base))))],
	playbookAttributes = [...new Set([].concat(...Object.keys(data.playbook).map(x => Object.keys(data.playbook[x].base))))],
	watchedAttributes = new Set(crewAttributes.concat(playbookAttributes)),
	actionsFlat = [].concat(...Object.keys(data.actions).map(x => data.actions[x])),
	traumaDataFlat = Object.keys(data.traumas).reduce((m, k) => m.concat(data.traumas[k]), []),
	autoExpandFields = [
		"repeating_ability:name",
		"repeating_ability:description",
		"repeating_crewability:name",
		"repeating_crewability:description",
		"repeating_playbookitem:name",
		"repeating_upgrade:name",
		"repeating_friend:name",
		"repeating_contact:name",
		"repeating_clock:name",
		"repeating_crewclock:name",
		"repeating_factionclock:name",
		"repeating_cohort:edges",
		"repeating_cohort:flaws",
		"repeating_alchemical:name",
		"xp_condition",
		"xp_condition_extra",
		"xp_condition2",
		"xp_condition3",
		"crew_xp_condition",
		"hunting_grounds_type",
		"hunting_grounds_description",
		"cohort1_edges",
		"cohort1_flaws",
		"heritage",
		"background",
		"vice_purveyor",
	],
	autogenSections = [
		"ability",
		"crewability",
		"friend",
		"contact",
		"playbookitem",
		"upgrade"
	],
	spiritPlaybooks = ["ghost", "hull", "vampire"],
	translatedNames = [...Object.keys(data.playbook), ...Object.keys(data.crew)].reduce((m, keyName) => {
		if (getTranslationByKey(keyName)) m[getTranslationByKey(keyName).toLowerCase()] = keyName;
		else m[keyName.toLowerCase()] = keyName;
		return m;
	}, {});
/* EVENT HANDLERS */
/* Set default fields when setting crew type or playbook */
on("change:crew_type change:playbook", event => {
	getAttrs(["playbook", "crew_type", "changed_attributes", "setting_autofill", ...watchedAttributes], v => {
		const changedAttributes = (v.changed_attributes || "").split(","),
			sourceName = translatedNames[(event.sourceAttribute === "crew_type" ? v.crew_type : v.playbook).toLowerCase()],
			fillBaseData = (inputData, defaultAttrNames) => {
				if (data) {
					const finalSettings = defaultAttrNames.filter(name => !changedAttributes.includes(name))
						// do not reset attributes which have been changed by the user
						.filter(name => !spiritPlaybooks.includes(sourceName) || !actionsFlat.includes(name))
						// do not reset action dots if changing to a spirit playbook
						.filter(name => v[name] !== (data.defaultValues[name] || ""))
						// do not set attributes if current value is equal to sheet defaults
						.reduce((m, name) => {
							m[name] = data.defaultValues[name] || "";
							return m;
						}, {});
					Object.keys(inputData).filter(name => !changedAttributes.includes(name))
						.forEach(name => (finalSettings[name] = inputData[name]));
					mySetAttrs(finalSettings);
				}
			};
		if (event.sourceAttribute === "crew_type" ? v.crew_type : v.playbook) {
			setAttr("show_playbook_reminder", "0");
		}
		if (v.setting_autofill !== "1") return;
		if (event.sourceAttribute === "crew_type" && sourceName in data.crew) {
			fillRepeatingSectionFromData("contact", data.crew[sourceName].contact, true);
			fillRepeatingSectionFromData("crewability", data.crew[sourceName].crewability, true);
			fillRepeatingSectionFromData("upgrade", data.crew[sourceName].upgrade, true);
			fillBaseData(data.crew[sourceName].base, crewAttributes);
		}
		if (event.sourceAttribute === "playbook" && sourceName in data.playbook) {
			fillRepeatingSectionFromData("friend", data.playbook[sourceName].friend, true);
			fillRepeatingSectionFromData("ability", data.playbook[sourceName].ability, true);
			fillRepeatingSectionFromData("playbookitem", data.playbook[sourceName].playbookitem, true);
			fillBaseData(data.playbook[sourceName].base, playbookAttributes);
			if (sourceName === "leech") fillRepeatingSectionFromData("alchemical", data.alchemicals);
		}
	});
});
const fillPlaybookAbility = () => {
	const prefix = "repeating_ability";
	getAttrs([`${prefix}_name`, `${prefix}_description`], v => {
		if (!v[`${prefix}_description`]) {
			const description = playbookAbilityMap.get((v[`${prefix}_name`] || "").toLowerCase());
			if (description) setAttr(`${prefix}_description`, description);
		}
	});
};
const fillCrewAbility = () => {
	const prefix = "repeating_crewability";
	getAttrs([`${prefix}_name`, `${prefix}_description`], v => {
		if (!v[`${prefix}_description`]) {
			const description = crewAbilityMap.get((v[`${prefix}_name`] || "").toLowerCase());
			if (description) setAttr(`${prefix}_description`, description);
		}
	});
};
on("change:repeating_ability:name", fillPlaybookAbility);
on("change:repeating_crewability:name", fillCrewAbility);
/* Watch repeating rows for changes and set autogen to false if change happens */
autogenSections.forEach(sectionName => {
	on(`change:repeating_${sectionName}`, event => {
		getAttrs([`repeating_${sectionName}_autogen`], v => {
			if (v[`repeating_${sectionName}_autogen`] && event.sourceType === "player") {
				setAttr(`repeating_${sectionName}_autogen`, "");
			}
		});
	});
});
/* Watch for changes in auto-set attributes and update changed_attributes*/
watchedAttributes.forEach(name => {
	on(`change:${name}`, event => {
		if (event.sourceType === "player") {
			getAttrs(["changed_attributes"], v => {
				const changedAttributes = [...new Set(v.changed_attributes.split(",")).add(name)]
					.filter(x => !!x).join(",");
				setAttr("changed_attributes", changedAttributes);
			});
		}
	});
});
/* Register attribute/action event handlers */
Object.keys(data.actions).forEach(attrName => {
	on([...data.actions[attrName], `setting_resbonus_${attrName}`]
		.map(x => `change:${x}`).join(" "), () => calculateResistance(attrName)
	);
	on(`change:${attrName}`, calculateVice);
});
/* Calculate stash */
on("change:stash", calculateStashFormula);
on("change:wanted", calculateWantedFormula);
/* Calculate trauma */
on("change:setting_traumata_set " + traumaDataFlat.map(x => `change:trauma_${x}`).join(" "), event => {
	getAttrs(["setting_traumata_set", ...traumaDataFlat.map(x => `trauma_${x}`)], v => {
		const traumaType = (v.setting_traumata_set === "0" ? "normal" : v.setting_traumata_set);
		if (data.traumas[traumaType] && event.sourceType === "player") {
			const newTrauma = data.traumas[traumaType].reduce((m, name) => m + (parseInt(v[`trauma_${name}`]) || 0), 0);
			setAttr("trauma", newTrauma);
		}
	});
});
/* Generate buttons */
on("change:generate_factions", () => {
	setAttr("show_faction_generatebutton", "0");
	Object.keys(data.factions).forEach(sectionName => {
		fillRepeatingSectionFromData(sectionName, data.factions[sectionName]);
	});
});
autogenSections.forEach(sectionName => {
	on(`change:generate_${sectionName}`, () => {
		getAttrs(["generate_source_character", "generate_source_crew", "sheet_type"], v => {
			const dataVar = (v.sheet_type === "character") ? data.playbook : data.crew,
				genSource = v[`generate_source_${v.sheet_type}`];
			if (genSource in dataVar) {
				emptyFirstRowIfUnnamed(sectionName);
				fillRepeatingSectionFromData(sectionName, dataVar[genSource][sectionName]);
			}
		});
	});
});
/* Extra stress and trauma */
on("change:setting_extra_stress", event => setAttr("stress_max", 9 + (parseInt(event.newValue) || 0)));
on("change:setting_extra_trauma", event => setAttr("trauma_max", 4 + (parseInt(event.newValue) || 0)));
/* Calculate cohort quality */
on(["crew_tier", "cohort1_impaired", "cohort1_type"].map(x => `change:${x}`).join(" "), () => calculateCohortDice(["cohort1"]));
on("change:repeating_cohort", () => calculateCohortDice(["repeating_cohort"]));
on("change:crew_tier", () => {
	getSectionIDs("repeating_cohort", a => calculateCohortDice(a.map(id => `repeating_cohort_${id}`)));
});
on("change:char_cohort_quality change:char_cohort_impaired change:setting_show_cohort", () => {
	getAttrs(["char_cohort_quality", "char_cohort_impaired"], v => {
		const dice = (parseInt(v.char_cohort_quality) || 0) - (parseInt(v.char_cohort_impaired) || 0);
		setAttr("char_cohort_roll_formula", buildRollFormula(dice));
	});
});
/* Set correct verb for cohort roll button */
["char_cohort", "cohort1", "repeating_cohort"].forEach(prefix => {
	const eventString = "change:" + ((prefix === "repeating_cohort") ? `${prefix}:type` : `${prefix}_type`);
	on(eventString, event => {
		const verb = (event.newValue === "expert") ? "^{rolls_their}" : "^{roll_their}";
		setAttr(`${prefix}_verb`, verb);
	});
});
/* Left-fill checkboxes */
handleBoxesFill("upgrade_24_check_", true);
handleBoxesFill("bandolier1_check_");
handleBoxesFill("bandolier2_check_");
["item", "playbookitem", "upgrade"].forEach(sName => handleBoxesFill(`repeating_${sName}:check_`));
/* Pseudo-radios */
["crew_tier", ...actionsFlat].forEach(name => {
	on(`change:${name}`, event => {
		if (String(event.newValue) === "0" && event.sourceType === "player") {
			setAttr(name, (parseInt(event.previousValue) || 1) - 1);
		}
		setAttr(`${name}_formula`, buildRollFormula(event.newValue || "0"));
	});
});
/* Item reset button */
on("change:reset_items", () => {
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
	setAttr("load", 0);
	["item", "playbookitem"].forEach(clearChecks);
});
/* Default values for number of upgrades boxes — probably not necessary anymore */
// on('change:repeating_upgrade:boxes_chosen', () => {
// 	getAttrs(['repeating_upgrade_numboxes'], v => {
// 		if (!['1', '2', '3'].includes(v.repeating_upgrade_numboxes)) {
// 			setAttr('repeating_upgrade_numboxes', '1');
// 		}
// 	});
// });
/* Resistance query */
on("change:setting_consequence_query sheet:opened", () => {
	getAttrs(["setting_consequence_query"], v => {
		const consequenceQuery = (String(v.setting_consequence_query) === "1") ?
			`?{${getTranslation("consequence")}|${getTranslation("a_consequence")}}` :
			"^{a_consequence}";
		setAttr("consequence_query", consequenceQuery);
	});
});
/* Trim whitespace in auto-expand fields */
autoExpandFields.forEach(name => {
	on(`change:${name}`, event => {
		const attrName = name.replace(":", "_");
		getAttrs([attrName], v => {
			if (v[attrName].trim() !== v[attrName] && event.sourceType === "player") {
				setAttr(attrName, v[attrName].trim());
			}
		});
	});
});
/* Clean chat image URL */
on("change:chat_image", event => {
	const match = (event.newValue || "").match(/^(https:\/\/s3\.amazonaws\.com\/files\.d20\.io\/images\/.*\.jpg)\?\d+$/);
	if (match) setAttr("chat_image", match[1]);
});
/* Number of dice prompt */
on("sheet:opened", () => {
	/* Set up translated attributes */
	const translatedAttrs = {
		bonusdice: getTranslation("bonusdice"),
		effect_query: getTranslation("effect_query"),
		notes_query: `?{${getTranslation("notes")}}`,
		numberofdice: buildNumdiceFormula(),
		position_query: `?{${getTranslation("position")}|` +
			`${getTranslation("risky")},position=${getTranslation("risky")}|` +
			`${getTranslation("controlled")},position=${getTranslation("controlled")}|` +
			`${getTranslation("desperate")},position=${getTranslation("desperate")}|` +
			`${getTranslation("fortune_roll")},position=}`,
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
on("sheet:opened", () => {
	getAttrs(["sheet_type", "changed_attributes", "crew_type", "playbook"], v => {
		/* Make sure sheet_type is never 0 */
		if (!["crew", "faction"].includes(v.sheet_type)) setAttr("sheet_type", "character");
		/* Remove reminder box if we have playbook or crew name */
		if (v.playbook || v.crew_type) setAttr("show_playbook_reminder", "0");
	});
	/* Setup and upgrades */
	getAttrs(["version"], v => {
		const upgradeSheet = version => {
				//const [major, minor] = version && version.split(".").map(x => parseInt(x));
				console.log(`Found version ${version}.`);
			},
			initialiseSheet = () => {
				const setting = ["ability", "friend", "crewability", "contact", "playbookitem", "upgrade", "framefeature"]
					.reduce((memo, sectionName) => {
						memo[`repeating_${sectionName}_${generateRowID()}_autogen`] = 1;
						return memo;
					}, {});
				mySetAttrs(setting);
				fillRepeatingSectionFromData("item", data.items);
				/* Set translated default values */
				getAttrs(Object.keys(data.translatedDefaults), v => {
					const setting = {};
					Object.keys(data.translatedDefaults).forEach(k => {
						if (v[k] !== data.translatedDefaults[k]) setting[k] = data.translatedDefaults[k];
					});
					mySetAttrs(setting);
				});
				console.log("Initialising new sheet.");
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
