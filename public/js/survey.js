import intializeDB from '../modules/db.js';
const db = intializeDB();

window.addEventListener('DOMContentLoaded', function () {
	firebase.auth().onAuthStateChanged(function(user) {
		if (user) {
			let userObj = {
				name: user.displayName,
		        email: user.email
    		};

    		document.querySelector("#display-name").innerHTML = user.displayName;
 
    		var userRef = db.collection("users").doc(user.uid);
			userRef.get().then(function(doc) {
			    if (!doc.exists) {
			    	writeUserInfo(user.uid, userObj);
			    }
			}).catch(function(error) {
			    console.log("Error getting document:", error);
			});

    		const surveyBtn = document.querySelector('.surveyBtn');
    		surveyBtn.addEventListener('click', function(event) { initalizeSurvey(event)}, false);

    		const viewBtn = document.querySelector('#viewBtn');
    		const responseRef = db.collection("users").doc(user.uid).collection("response").doc("surveyResult");

    		responseRef.get().then(function(doc){
    			if(doc.exists){
    				surveyBtn.innerHTML = "Retake Survey";
    				viewBtn.addEventListener('click', function(event) { displayResponseView(event)}, false);
    			}
    			else{
    				viewBtn.style.visibility = "hidden";
    			}
    		}).catch(function(error){
    			console.error("Error getting document:", error);
    		});

    		const nextBtn = document.querySelector("#nextBtn");
    		nextBtn.addEventListener('click', function(event) { nextSurvey(event)}, false);

    		const backBtn = document.querySelector("#backBtn");
    		backBtn.addEventListener('click', function(event) { displayPrimary(event)}, false);

    		const submitBtn = document.querySelector("#submitBtn");
    		submitBtn.addEventListener('click', function(event) { storeSurvey(event)}, false);

		} else {
			console.error("No one is signed in");
			location.replace("index.html");
		}
	});
});

/* REFACTOR NEEDED: Writes the user data to FireStore */
function writeUserInfo(uid, userObj){
    db.collection("users").doc(uid).set(userObj).then(function() {
    }).catch(function(error) {
        console.error("Error while writing document: ", error);
    });
}

/* Initalize survey questions from database */ 
function initalizeSurvey(event){
	document.querySelector('.surveyBtn').style.display = "none";
	document.querySelector("#nextBtn").style.visibility = "visible";
	document.querySelector("#responseContainer").style.display = "none";
	document.querySelector("#primaryQ").style.display = "block";
	displayPrimaryQuestions(displayResponse);
}

function displayResponseView(event){
	document.querySelector('.surveyBtn').style.display = "inline-block";
	document.querySelector('#viewBtn').style.display = "none";
	document.querySelector("#primaryQ").style.display = "none";
	document.querySelector("#followUpQ").style.display = "none";
	document.querySelector("#responseContainer").style.display = "block";

	const userId = firebase.auth().currentUser.uid;
	const container = document.querySelector("#responseContainer");
	const responseRef = db.collection("users").doc(userId).collection("response").doc("surveyResult");
	const questionRef =  db.collection("questionnaires");

	responseRef.get().then(function(doc) {
		if (doc.exists){
			const surveyResult = doc.data();
			questionRef.get().then(function(querySnapshot) {
				 querySnapshot.forEach(function(doc) {
				 	let sectionId = doc.id;
	        		let sectionTitle = doc.data().title;

					let tSection = document.querySelector('#section');
		       		tSection.content.querySelector('div').setAttribute('id', sectionId);      
		       		tSection.content.querySelector('div h3').innerHTML = sectionTitle;
		       		let clonedTemplate = document.importNode(tSection.content, true);
		       		container.appendChild(clonedTemplate);

		       		const sectionContainer = container.querySelector("div#"+sectionId);
		       		let tTable = document.querySelector("#tableTemp");
		       		clonedTemplate = document.importNode(tTable.content, true);
		       		sectionContainer.appendChild(clonedTemplate);

		       		const questionSet = questionRef.doc(sectionId).collection("set");

		       		questionSet.get().then(function(querySnapshot) {
		       			querySnapshot.forEach(function(doc) {
		       				let questId = doc.id;
			        		let questData = doc.data();
			        		let questValue = questData.value;
			        		let questNumber = questId.charAt(1);
		
		       				let tQuestion = document.querySelector('#responseRow');
		       				tQuestion.content.querySelector('td#questionNumCell').innerHTML = questNumber;
		       				tQuestion.content.querySelector('td#questionCell').innerHTML = questData.question;
			       			tQuestion.content.querySelector('td#responseCell').innerHTML = surveyResult.primary[questId].answerText;
			       			let clonedTemplate = document.importNode(tQuestion.content, true);
			       			sectionContainer.querySelector("tbody").appendChild(clonedTemplate);

			       			let primaryQuestionId = questId;
			       			if(questData.followUp){
			       				questionSet.doc(primaryQuestionId).collection("subSet").get().then(function(subSnapShot) {
	       							subSnapShot.forEach(function(doc) {
	       								let questId = primaryQuestionId + doc.id;
					        			let questData = doc.data();
					        			let questLetter = (primaryQuestionId.charAt(1) + doc.id).toUpperCase();

										let tQuestion = document.querySelector('#responseRow');
										tQuestion.content.querySelector('td#questionNumCell').innerHTML = questLetter;
		       							tQuestion.content.querySelector('td#questionCell').innerHTML = questData.question;
		       							if(surveyResult.followUp[questId]){
		       								tQuestion.content.querySelector('td#responseCell').innerHTML = surveyResult.followUp[questId].answerText;
		       							}
		       							else{
		       								tQuestion.content.querySelector('td#responseCell').innerHTML = "N/A";
		       							}
			       						let clonedTemplate = document.importNode(tQuestion.content, true);
			       						sectionContainer.querySelector("tbody").appendChild(clonedTemplate);
	       							});
	       						});
			       			}
		       			});
		       		});
				 });
			});
		} else {
			console.error("No such document!");
		}
	}).catch(function(error){
		console.error("Error getting document:", error);
	});
}

/* Displays the primary questions of the survey 
   @param - callback function to call after the questionnaries are generated 
*/
function displayPrimaryQuestions(callback){
	const questionRef =  db.collection("questionnaires");
	const container = document.querySelector("#primary-container");

	questionRef.get().then(function(querySnapshot) {
		//Interate through each document in each section 
	    querySnapshot.forEach(function(doc) {
	        // doc.data() is never undefined for query doc snapshots
	        let sectionId = doc.id;
	        let sectionTitle = doc.data().title;
	        let sectionValue = doc.data().totalValue;

	        let tSection = document.querySelector('#section');
	       	tSection.content.querySelector('div').setAttribute('id', sectionId);      
	       	tSection.content.querySelector('div h3').innerHTML = sectionTitle;
	       	let clonedTemplate = document.importNode(tSection.content, true);
	       	container.appendChild(clonedTemplate);

	       	const sectionContainer = container.querySelector("div#"+sectionId);
	       	//sectionContainer.appendChild(clonedTemplate);
	       	const questionSet = questionRef.doc(sectionId).collection("set");

			questionSet.get().then(function(querySnapshot) {
				//Primary Decision Makers
			    querySnapshot.forEach(function(doc) {
			        // Each question 
			        let questId = doc.id;
			        let questData = doc.data();

			        let questValue = questData.value;
			        let questType = questData.questionType;
			        let questNumber = questId.charAt(1);
			        let followUpVal = questData.followUp ? questData.followUpVal : NaN; 

			        let tQuestion = document.querySelector('#questTemp');
			       	tQuestion.content.querySelector('p').innerHTML = questNumber + ". " + questData.question;
			        tQuestion.content.querySelector('p').setAttribute('id', questId);

			       	let optionMARKUP = ``;

			        // Displaying different types of questions
			        switch(questType){
			        	case 0:
			        		break;
			        	case 1: //Binary Question
			        		questData.choice.options.forEach(function(option){
			        			optionMARKUP += renderBinaryQuestion(questId, option.optionValue, questValue, option.isPositive, followUpVal);
			        		});
			        		break;
			        	case 2: //Checkbox
			        		let optionValue = questValue/(questData.choice.options.length);

			        		for(var index = 0; index < questData.choice.options.length; index++){
			        			let option = questData.choice.options[index];
			        			optionMARKUP += renderCheckboxQuestion(questId, option.optionValue, index, optionValue, followUpVal);
			        		}
			        		break;
			        	case 3: //Dropdown
			        		break;
			        	case 4: //BMI
			        		break;
			        	default:
			        		console.error("Invalid type of question found");
			        }

			       	tQuestion.content.querySelector('div.options').innerHTML = optionMARKUP;
			       	let clonedTemplate = document.importNode(tQuestion.content, true);
			       	sectionContainer.appendChild(clonedTemplate);
			    });
			});
	    });
	    callback("primaryQuestForm", true);
	});
}

/* Displays the user response on the survey 
   @param: formName - name of the form 
   @param: isPrimary - true if the form is referring to the primaryQuestionForm; false otherwise;
*/
function displayResponse(formName, isPrimary){

	const form = document.forms[formName];
	const userId = firebase.auth().currentUser.uid;
	const responseRef = db.collection("users").doc(userId).collection("response").doc("surveyResult");

	responseRef.get().then(function(doc) {
		if (doc.exists){
			if(isPrimary){
				const response = doc.data().primary;
				for (var key in response){
					if(response.hasOwnProperty(key)){
						let questionName = "question-" + key; 
						let answerValue = response[key].answerValue;
						if(Array.isArray(answerValue)){
							for(var index = 0; index < answerValue.length; index++){
								$(".checkbox").find('input[value="' + answerValue[index] + '"]').prop('checked', true);
							}
						}
						else{
							form[questionName].value = answerValue;
						}
					}
				}
			}
			else{
				const response = doc.data().followUp;
				for (var key in response){
					if(response.hasOwnProperty(key)){
						let questionName = "question-" + key; 
						let answerValue = response[key].answerValue;
						let propLength = Object.keys(answerValue).length;
						if(propLength > 0){
							for(var key in answerValue){
								if(form[key] != undefined){
									form[key].value = answerValue[key];
								}
							}	
						}
						else{
							form[questionName].value = answerValue;
						}
					}
				}
			}
		} else {
			console.error("No such document!");
		}
	}).catch(function(error){
		console.error("Error getting document:", error);
	});
}

/* Displays the follow-up questions of the survey 
   @param - callback function to call after the questionnaries are generated 
   @followUpList - list of questions that requires follow-up questions
*/
function displayFollowUpQuestion(callback, followUpList){
	const container = document.querySelector("#followUp-container");
	removeChildren(container);
	document.querySelector("#primaryQ").style.display = "none";
	document.querySelector("#followUpQ").style.display = "block";
	toggleBtns(false);

	const questionRef =  db.collection("questionnaires");

	//Display Follow Up Questions
	questionRef.get().then(function(querySnapshot) {
		//Interate through each document in each section 
	    querySnapshot.forEach(function(doc) {
	        let sectionId = doc.id;
	        let sectionTitle = doc.data().title;
	        let followUps; 

	        switch(sectionId){
	        	case "basicInfo":
	        		followUps = followUpList.m;
	        		break;
	        	case "health":
	        		followUps = followUpList.d;
	        		break;
	        	case "lifestyle":
	        		followUps = followUpList.l;
	        		break;
	        }

	        let tSection = document.querySelector('#section');
	       	tSection.content.querySelector('div').setAttribute('id', sectionId);      
	       	tSection.content.querySelector('div h3').innerHTML = sectionTitle;
	       	let clonedTemplate = document.importNode(tSection.content, true);
	       	container.appendChild(clonedTemplate);

	       	const sectionContainer = container.querySelector("div#"+sectionId);
	       	//sectionContainer.appendChild(clonedTemplate);
	       	const questionSet = questionRef.doc(sectionId).collection("set");

	       	//Iterate through followup questions 
	       	for(var i = 0; i < followUps.length; i++){
	       		let primaryQuestionId = followUps[i];
	       		questionSet.doc(primaryQuestionId).collection("subSet").get().then(function(subSnapShot) {
	       			subSnapShot.forEach(function(doc) {
				    	if (doc.exists) {
					        let questId = primaryQuestionId + doc.id;
					        let questData = doc.data();
					        let questLetter = questId.toUpperCase();
					        let questType = questData.questionType;

					        let tQuestion = document.querySelector('#questTemp');
					       	tQuestion.content.querySelector('p').innerHTML = questLetter + ". " + questData.question;
					        tQuestion.content.querySelector('p').setAttribute('id', questId);

					       	let optionMARKUP = ``;

					        // Displaying different types of questions
					        switch(questType){
					        	case 0:
					        		break;
					        	case 1: //Binary Question
					        		questData.choice.options.forEach(function(option){
					        			optionMARKUP += renderFollowUpBinaryQuestions(questId, option.optionValue, option.priority);
					        		});
					        		break;
					        	case 2: //Checkbox
					        		questData.choice.options.forEach(function(option){
					        			optionMARKUP += renderFollowUpCheckboxQuestions(questId, option.optionValue, option.priority);
					        		});
					        		break;
					        	case 3: //Dropdown
					        		let priority = questData.choice.priority;
					        		questData.choice.options.forEach(function(option){
					        			optionMARKUP += renderFollowUpDropdownOptions(option, priority);
					        		});

					        		optionMARKUP = renderFollowUpDropdownQuestion(questId, optionMARKUP);
					        		break;
					        	case 4: //BMI
					        		optionMARKUP = renderBMIQUestion(questId);
					        		break;
					        	default:
					        		console.error("Invalid type of question found");
					        }
			  
					       	tQuestion.content.querySelector('div.options').innerHTML = optionMARKUP;
					       	let clonedTemplate = document.importNode(tQuestion.content, true);
					       	sectionContainer.appendChild(clonedTemplate);
				    	}
	       			});
				});
	       	}
	    });
	    callback("followUpForm", false);
	});
}

/* Displays primary question section */
function displayPrimary(event){
	document.querySelector("#followUpQ").style.display = "none";
	document.querySelector("#primaryQ").style.display = "block";
	toggleBtns(true);
}

/* Displays the proper set of buttons depending on its section 
   @param isPrimary - true if primary questions section; false otherwise
*/
function toggleBtns(isPrimary){
	if(isPrimary){	
		document.querySelector("#nextBtn").style.visibility = "visible";
		document.querySelector("#backBtn").style.visibility = "hidden";
		document.querySelector("#submitBtn").style.visibility = "hidden";	
	}
	else{
		document.querySelector("#nextBtn").style.visibility = "hidden";
		document.querySelector("#backBtn").style.visibility = "visible";
		document.querySelector("#submitBtn").style.visibility = "visible";
	}
}

/* Displays the followUp question section */
function nextSurvey(event){
	const formName = "primaryQuestForm";
	const form = document.forms[formName];

	//To trigger the HTML5 Built-in Validation
	if(form.checkValidity()){
		event.preventDefault();
		const fList = getFollowUpQ(formName);
		displayFollowUpQuestion(displayResponse, fList);
	}
	else{
		return 0;
	}	
}

/* Determines which primary questions require follow-up questions and update user response 
   @param formName - name of the form element 
*/
function getFollowUpQ(formName){
	const form = document.forms[formName];
	const radioInputList = form.querySelectorAll("input[type=radio]:checked");
	const checkInputList = form.querySelectorAll("input[type=checkbox]:checked");
	let surveyResult = 0;

	let followUpList = {
		m:[],
		d:[],
		l:[]
	};

	let questId = -1;
	let questType;
	let fValue = 0;
	let checkboxText = [];
	let checkboxValues = [];
	let checkboxTotalValue = 0;

	radioInputList.forEach(function(input) {
		questId = input.name.split('-')[1];
		fValue = input.getAttribute('data-fvalue');
		if(input.value === fValue){
			followUpList[questId[0]].push(questId);
		}
		if(parseInt(input.value) > 0){
			surveyResult += parseInt(input.value); 
		}
		let responseObj = createResponseObj(input);
		RESPONSE.primary[questId] = responseObj;
	});

	checkInputList.forEach(function(input) {
		questId = input.name.split('-')[1];
		questType = input.name.split('-')[0];
		checkboxText.push(input.getAttribute('data-text'));
		checkboxValues.push(parseInt(input.value));
		checkboxTotalValue += parseInt(input.getAttribute('data-cvalue'));
		fValue = input.getAttribute('data-fvalue');
	});	

	followUpList[questId[0]].push(questId);

	surveyResult+=checkboxTotalValue;
 
	let responseObj = {"answerValue": checkboxValues, "answerText": checkboxText};
	RESPONSE.primary[questId] = responseObj;
	RESPONSE["primaryResult"] = surveyResult;
	return followUpList;
}

/* Stores the user response into database */ 
function storeSurvey(event){
	const formName = "followUpForm";
	const form = document.forms[formName];

	//To trigger the HTML5 Built-in Validation
	if(form.checkValidity()){
		event.preventDefault();
		getFollowUpResponse(formName);
		storeSurveyDB(formName);
	}
	else{
		return 0;
	}
}

function getFollowUpResponse(formName){
	const form = document.forms[formName];
	const radioInputList = form.querySelectorAll("input[type=radio]:checked");
	const selectInputList = form.querySelectorAll("select");

	radioInputList.forEach(function(input) {
		let questId = input.name.split('-')[1];
		let responseObj = createResponseObj(input);
		RESPONSE.followUp[questId] = responseObj;
	});

	selectInputList.forEach(function(element) {
		let questId = element.name.split('-')[1];
		let optionText = element.selectedOptions[0].text;
		let optionValue = parseInt(element.selectedOptions[0].value);
		let responseObj = {"answerValue": optionValue, "answerText": optionText};
		RESPONSE.followUp[questId] = responseObj;
	});	

	if(form["height-feet"]){
		var BMIquestId = form["height-feet"].getAttribute('data-questId');
		let responseObj = {};
		let answerValue = {
			"height-feet" : parseInt(form["height-feet"].value),
			"height-inch" : parseInt(form["height-inch"].value),
			"weight" : parseInt(form["weight"].value),
			"priority" : 0
		};
		var heightInch = parseFloat(answerValue["height-feet"] * 12) + parseFloat(answerValue["height-inch"]);
		const BMI = calculateBMI(heightInch, answerValue["weight"]);

		if(BMI > 40){
			answerValue.priority = 4;
		}
		else if(BMI > 30){
			answerValue.priority = 3;
		}
		else if(BMI > 25){
			answerValue.priority = 2;
		}
		else{
			answerValue.priority = 1;
		}

		responseObj = {"answerValue": answerValue, "answerText": BMI};
		RESPONSE.followUp[BMIquestId] = responseObj;
	}
}

function calculateBMI(heightInch, weightPound){
	const weightKg = weightPound * 0.45359237;
	const heightM = heightInch * 0.0254;
	return Math.round((weightKg/(heightM*heightM)));
}
 
function storeSurveyDB(formName){
	const userId = firebase.auth().currentUser.uid;
	const userRef = db.collection("users").doc(userId);

	userRef.get().then(function(doc) {
		if (doc.exists){			
			userRef.collection("response").doc("surveyResult").set(RESPONSE).then(function() {
				alert("Successfully saved your survey response!");
				window.location.replace("survey.html");
			}).catch(function(error) {
				console.error("Error while writing document: ", error);
			});
		} else {
			console.error("No such document!");
		}
	}).catch(function(error){
		console.error("Error getting document:", error);
	});
}

function createResponseObj(input){
	return {
		"answerValue" : parseInt(input.value),
		"answerText" : input.getAttribute('data-text')
	};
}

function renderBinaryQuestion(questId, optionText, questionValue, isPositive, followUpVal){
	let MARKUP =``;
	let qValue = questionValue;
	if(!isPositive){ qValue = -questionValue; }
	MARKUP = `<label class="radio-inline"><input type="radio" name="question-${questId}" value="${qValue}" data-fvalue = "${followUpVal}" data-text="${optionText}" required>${optionText}</label>`;
	return MARKUP;
}

function renderCheckboxQuestion(questId, optionText, optionValue, questionValue, followUpVal){
	let MARKUP = ``;
	let qValue = questionValue;
	MARKUP = `<label class="checkbox"><input type="checkbox" name="question-${questId}" value="${optionValue}" data-cvalue=${qValue} data-fvalue = "${followUpVal}"  data-text="${optionText}">${optionText}</label>`;
	return MARKUP; 
}

function renderFollowUpBinaryQuestions(questId, optionText, priority){
	return `<label class="radio-inline"><input type="radio" name="question-${questId}" value="${priority}" data-text="${optionText}" required>${optionText}</label>`;
}

function renderFollowUpCheckboxQuestions(questId, optionText, priority){
	return `<label class="checkbox"><input type="checkbox" name="question-${questId}" value="${priority}" data-text="${optionText}">${optionText}</label>`;
}

function renderFollowUpDropdownOptions(optionText, priority){
	return `<option value="${priority}" data-text="${optionText}">${optionText}</label>`;
}

function renderFollowUpDropdownQuestion(questId, optionsMARKUP){
	let MARKUP = `<select class="form-control" name="question-${questId}" required"><option value="" disabled selected hidden>Please Choose...</option>`;
	return MARKUP + optionsMARKUP + `</select>`;
}

function renderBMIQUestion(questId){
	let MARKUP = `<div class="form-inline"><label for="height-feet">Height:&nbsp;</label><input type="number" class="form-control" name="height-feet" id="height-feet" data-questId="${questId}" size="1" required placeholder="Feet">
				<input type="number" class="form-control" name="height-inch" id="height-inch" data-questId="${questId}" size="2" required placeholder="Inch"></div>
				<div class="form-inline"><label for="weight">Weight(lbs):&nbsp;</label><input type="number" class="form-control" name="weight" id="weight"  data-questId="${questId}" size="3" required placeholder="Lbs"></div>`;
	return MARKUP;
}

/*
* Removes all the children of the node.
* Faster than innerHTML = ""
*/
function removeChildren(node){
	while (node.firstChild) {
		node.removeChild(node.firstChild);
	}
 }


const RESPONSE = {
	primary : {},
	followUp : {}
};
