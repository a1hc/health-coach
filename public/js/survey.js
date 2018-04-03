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

    		const nextBtn = document.querySelector("#nextBtn");
    		nextBtn.addEventListener('click', function(event) { nextSurvey(event)}, false);

    		const backBtn = document.querySelector("#backBtn");
    		backBtn.addEventListener('click', function(event) { displayPrimary(event)}, false);

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

	const questionRef =  db.collection("questionnaires");
	const container = document.querySelector("#primary-container");

	questionRef.get().then(function(querySnapshot) {
		//Interate through each document in each section 
	    querySnapshot.forEach(function(doc) {
	        // doc.data() is never undefined for query doc snapshots
	        //console.log(doc.id, " => ", doc.data());
	        let sectionId = doc.id;
	        let sectionTitle = doc.data().title;
	        let sectionValue = doc.data().totalValue;

	        let tSection = document.querySelector('#section');
	       	tSection.content.querySelector('div').setAttribute('id', sectionId);      
	       	tSection.content.querySelector('div h3').innerHTML = sectionTitle;
	       	let clonedTemplate = document.importNode(tSection.content, true);
	       	container.appendChild(clonedTemplate);

	       	const sectionContainer = container.querySelector("div#"+sectionId);
	       	sectionContainer.appendChild(clonedTemplate);
	       	const questionSet = questionRef.doc(sectionId).collection("set");

			questionSet.get().then(function(querySnapshot) {
				//Primary Decision Makers
			    querySnapshot.forEach(function(doc) {
			        //console.log(doc.id, " => ", doc.data());
			        
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

			        		questData.choice.options.forEach(function(option){
			        			optionMARKUP += renderCheckboxQuestion(questId, option.optionValue, optionValue, followUpVal);
			        		});
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
	});
}

function displayFollowUp(followUpList){
	const container = document.querySelector("#followUp-container");
	removeChildren(container);
	document.querySelector("#primaryQ").style.display = "none";
	document.querySelector("#followUpQ").style.display = "block";
	toggleBtns(false);

	const questionRef =  db.collection("questionnaires");
	console.log(followUpList);

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
	       	sectionContainer.appendChild(clonedTemplate);
	       	const questionSet = questionRef.doc(sectionId).collection("set");

	       	//Iterate through followup questions 
	       	for(var i = 0; i < followUps.length; i++){
	       		let primaryQuestionId = followUps[i];
	       		questionSet.doc(primaryQuestionId).collection("subSet").get().then(function(subSnapShot) {
	       			subSnapShot.forEach(function(doc) {
				    	if (doc.exists) {
				    		console.log(doc.id, " =>?! ", doc.data());

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
					        		console.log("Binary Question Found");
					        		questData.choice.options.forEach(function(option){
					        			optionMARKUP += renderFollowUpBinaryQuestions(questId, option.optionValue, option.priority);
					        		});
					        		break;
					        	case 2: //Checkbox
					        		console.log("Checkbox Question Found");
					        		questData.choice.options.forEach(function(option){
					        			optionMARKUP += renderFollowUpCheckboxQuestions(questId, option.optionValue, option.priority);
					        		});
					        		break;
					        	case 3: //Dropdown
					        		console.log("Dropdown Question Found");
					        		let priority = questData.choice.priority;
					        		questData.choice.options.forEach(function(option){
					        			optionMARKUP += renderFollowUpDropdownOptions(option, priority);
					        		});

					        		optionMARKUP = renderFollowUpDropdownQuestion(questId, optionMARKUP);

					        		break;
					        	case 4: //BMI
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
	});

}

function displayPrimary(event){
	document.querySelector("#followUpQ").style.display = "none";
	document.querySelector("#primaryQ").style.display = "block";
	toggleBtns(true);
}

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

function nextSurvey(event){
	const formName = "primaryQuestForm";
	const form = document.forms[formName];

	//To trigger the HTML5 Built-in Validation
	if(form.checkValidity()){
		event.preventDefault();
		const fList = getFollowUpQ(formName);
		displayFollowUp(fList);
	}
	else{
		return 0;
	}	
}


function getFollowUpQ(formName){
	const form = document.forms[formName];
	const radioInputList = form.querySelectorAll("input[type=radio]:checked");
	const checkInputList = form.querySelectorAll("input[type=checkbox]:checked");

	let followUpList = {
		m:[],
		d:[],
		l:[]
	};

	let questId = -1;
	let questType;
	let fValue = 0;
	let checkboxText = [];
	let checkboxValue = 0;

	radioInputList.forEach(function(input) {
		questId = input.name.split('-')[1];
		fValue = input.getAttribute('data-fvalue');
		if(input.value === fValue){
			followUpList[questId[0]].push(questId);
		}
		let responseObj = createResponseObj(input);
		RESPONSE[questId] = responseObj;
	});

	checkInputList.forEach(function(input) {
		questId = input.name.split('-')[1];
		questType = input.name.split('-')[0];
		checkboxText.push(input.getAttribute('data-text'));
		checkboxValue += parseInt(input.value);
		fValue = input.getAttribute('data-fvalue');
	});	

	if (checkboxValue === fValue){
		followUpList[questId[0]].push(questId);
	}
 
	let responseObj = {"answerValue": checkboxValue, "answerText": checkboxText};
	RESPONSE[questId] = responseObj;

	console.log(RESPONSE);
	return followUpList;
}

function storeSurvey(event){
	const formName = "surveyForm";
	const form = document.forms[formName];

	//To trigger the HTML5 Built-in Validation
	if(form.checkValidity()){
		event.preventDefault();
		storeSurveyDB(formName);
	}
	else{
		return 0;
	}
}


//Need REFACTORING : 
function storeSurveyDB(formName){
	const userId = firebase.auth().currentUser.uid;
	const userRef = db.collection("users").doc(userId);

	userRef.get().then(function(doc) {
		if (doc.exists){
			const form = document.forms[formName];
			const radioInputList = form.querySelectorAll("input[type=radio]:checked");
			const checkInputList = form.querySelectorAll("input[type=checkbox]:checked");
			const responseRef = userRef.collection("responses");
			let surveyResult = 0;
			let checkboxValue = 0;
			let checkboxText = [];
			let questId = -1;

			radioInputList.forEach(function(input) {
				let questId = input.name.split('-')[1];
				const responseObj = createResponseObj(input);
						
				if(parseInt(input.value) > 0){
					surveyResult += parseInt(input.value); 
				}
						
				let fValue = input.getAttribute('data-fvalue');
				if(input.value === fValue){
					followUpList.push(questId);
				}

				// Writes the survey overall result (positive)
				responseRef.doc(questId).set(responseObj).then(function() {
					console.log("Successfully saved to database");
				}).catch(function(error) {
					console.error("Error while writing document: ", error);
				});
			});	

			// Assume that there is only one checkbox question
			checkInputList.forEach(function(input) {
				questId = input.name.split('-')[1];
				checkboxText.push(input.getAttribute('data-text'));
				checkboxValue += parseInt(input.value);
			});	

			surveyResult+=checkboxValue;
			const responseObj = {"answerValue": checkboxValue, "answerText": checkboxText};

			if(checkInputList.length > 0 && questId != -1){
				responseRef.doc(questId).set(responseObj).then(function() {
					console.log("Successfully saved to database");

				}).catch(function(error) {
					console.error("Error while writing document: ", error);
				});
			}

			responseRef.doc("surveyResult").set({"value":surveyResult}).then(function() {
				console.log("Successfully saved to database");
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

function renderCheckboxQuestion(questId, optionText, questionValue, followUpVal){
	let MARKUP = ``;
	let qValue = questionValue;
	MARKUP = `<label class="checkbox"><input type="checkbox" name="question-${questId}" value="${qValue}" data-fvalue = "${followUpVal}"  data-text="${optionText}">${optionText}</label>`;
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
	let MARKUP = `<select class="form-control" name="question-${questId}">`;
	return MARKUP + optionsMARKUP + `</select>`;
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

 function changeDisplay(className, display) {
    var elems = document.querySelectorAll(className);
    var index = 0, length = elems.length;
    for ( ; index < length; index++) {
        elems[index].style.display = display;
    }
}

const RESPONSE = {};
