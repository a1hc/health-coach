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
    		nextBtn.addEventListener('click', function(event) { storeSurvey(event)}, false);

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
	var btn = event.target;
	btn.style.display = "none";

	document.querySelector("#nextBtn").style.visibility = "visible";

	const questionRef =  db.collection("questionnaires");
	const container = document.querySelector("#survey-container");

	questionRef.get().then(function(querySnapshot) {
	    querySnapshot.forEach(function(doc) {
	        // doc.data() is never undefined for query doc snapshots
	        console.log(doc.id, " => ", doc.data());
	        let sectionId = doc.id;
	        let sectionTitle = doc.data().title;
	        let sectionValue = doc.data().totalValue;

	        let tSection = document.querySelector('#section');
	       	tSection.content.querySelector('div').setAttribute('id', sectionId);      
	       	tSection.content.querySelector('div h3').innerHTML = sectionTitle;
	       	let clonedTemplate = document.importNode(tSection.content, true);
	       	container.appendChild(clonedTemplate);

	       	const sectionContainer = document.querySelector("div#"+sectionId);
	       	sectionContainer.appendChild(clonedTemplate);
	       	const questionSet = questionRef.doc(sectionId).collection("set");

			questionSet.get().then(function(querySnapshot) {
			    querySnapshot.forEach(function(doc) {
			        console.log(doc.id, " => ", doc.data());
			        
			        let questId = doc.id;
			        let questData = doc.data();
			        let questValue = questData.value;
			        let questionNumber = questId.charAt(1);

			        if(questData.binaryQuestion){
			        	let tBinary = document.querySelector('#binaryTemp');
			        	tBinary.content.querySelector('p').innerHTML = questionNumber + ". " + questData.question;
			        	tBinary.content.querySelector('p').setAttribute('id', questId);
			        	let optionMARKUP = ``;
			        	
			        	questData.choice.options.forEach(function(option){
			        		optionMARKUP += renderBinaryQuestion(questId, option.optionValue, questValue, option.isPositive);
			        	});

			        	tBinary.content.querySelector('div.options').innerHTML = optionMARKUP;
			        	
			        	let clonedTemplate = document.importNode(tBinary.content, true);
			        	sectionContainer.appendChild(clonedTemplate);
			        }
			        else if(questData.recallQuestion){
			        	console.log("Recall question found");

			        	let tBinary = document.querySelector('#binaryTemp');
			        	tBinary.content.querySelector('p').innerHTML = questionNumber + ". " + questData.question;
			        	tBinary.content.querySelector('p').setAttribute('id', questId);
			        	let optionMARKUP = ``;
			        	let optionValue = questValue/(questData.choice.options.length);
			        	
			        	questData.choice.options.forEach(function(option){
			        		optionMARKUP += renderRecallQuestion(questId, option.optionValue, optionValue);
			        	});

			        	tBinary.content.querySelector('div.options').innerHTML = optionMARKUP;
			        	
			        	let clonedTemplate = document.importNode(tBinary.content, true);
			        	sectionContainer.appendChild(clonedTemplate);
			        }
			        else{
			        	console.log("Not a binary question or a recall question.")
			        }
			    });
			});
	    });
	});
}

function displayNextSurvey(event){
	console.log("Save it to database");
	storeSurveyDB("surveyForm");
}

function storeSurvey(event){
	const formName = "surveyForm";
	const form = document.forms[formName];

	//To trigger the HTML5 Built-in Validation
	if(form.checkValidity()){
		storeSurveyDB(formName);
		event.preventDefault();
	}
	else{
		return 0;
	}
}


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

			radioInputList.forEach(function(input) {
				let questId = input.name.split('-')[1];
				const responseObj = createResponseObj(input);

				if(isNaN(input.value)){
					let numValue = parseInt(input.value);
					surveyResult += numValue;
				}

				responseRef.doc(questId).set(responseObj).then(function() {
					console.log("Successfully saved to database");
				}).catch(function(error) {
					console.error("Error while writing document: ", error);
				});
			});	

			let checkboxText = [];
			let checkboxValue = 0;
			let questId = -1;

			// Assume that there is only one checkbox question
			checkInputList.forEach(function(input) {
				questId = input.name.split('-')[1];
				checkboxText.push(input.getAttribute('data-text'));
				checkboxValue += parseInt(input.value);
			});	

			surveyResult += checkboxValue; 
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
	let answerValue = 0;

	if(Number.isInteger(input.value)){
		answerValue = parseInt(input.value);
	}

	return {
		"answerValue" : answerValue,
		"answerText" : input.getAttribute('data-text')
	};
}

function renderBinaryQuestion(questId, optionText, questionValue, isPositive){
	let MARKUP =``;
	let qValue = questionValue;
	if(!isPositive){ qValue = -questionValue; }
	MARKUP = `<label class="radio-inline"><input type="radio" name="question-${questId}" value="${qValue}" data-text="${optionText}" required>${optionText}</label>`;
	return MARKUP;
}

function renderRecallQuestion(questId, optionText, questionValue){
	let MARKUP = ``;
	let qValue = questionValue;
	MARKUP = `<label class="checkbox"><input type="checkbox" name="question-${questId}" value="${qValue}" data-text="${optionText}">${optionText}</label>`;
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

 function changeDisplay(className) {
    var elems = document.querySelectorAll(className);
    var index = 0, length = elems.length;
    for ( ; index < length; index++) {
        elems[index].style.display = "none";
    }
}