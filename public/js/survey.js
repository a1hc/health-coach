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
			        let followUpVal = questData.followUp ? questData.followUpVal : NaN; 

			        if(questData.binaryQuestion){
			        	let tBinary = document.querySelector('#binaryTemp');
			        	tBinary.content.querySelector('p').innerHTML = questionNumber + ". " + questData.question;
			        	tBinary.content.querySelector('p').setAttribute('id', questId);
			        	let optionMARKUP = ``;
			        	
			        	questData.choice.options.forEach(function(option){
			        		optionMARKUP += renderBinaryQuestion(questId, option.optionValue, questValue, option.isPositive, followUpVal);
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
			        		optionMARKUP += renderRecallQuestion(questId, option.optionValue, optionValue, followUpVal);
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

function displayFollowUp(followUpList){
	console.log(followUpList);

}

function nextSurvey(event){
	const formName = "surveyForm";
	const form = document.forms[formName];

	//To trigger the HTML5 Built-in Validation
	if(form.checkValidity()){
		event.preventDefault();
		const fList = checkFollowUp(formName);
		displayFollowUp(fList);
	}
	else{
		return 0;
	}	
}

function checkFollowUp(formName){
	const form = document.forms[formName];
	const radioInputList = form.querySelectorAll("input[type=radio]:checked");
	const checkInputList = form.querySelectorAll("input[type=checkbox]:checked");
	let followUpList = [];
	let questId = -1;
	let fValue = 0;
	let checkboxText = [];
	let checkboxValue = 0;

	radioInputList.forEach(function(input) {
		questId = input.name.split('-')[1];
		fValue = input.getAttribute('data-fvalue');
		console.log("fValue for questionId " + questId + " is " + fValue);
		if(input.value === fValue){
			followUpList.push(questId);
		}
	});

	checkInputList.forEach(function(input) {
		questId = input.name.split('-')[1];
		checkboxText.push(input.getAttribute('data-text'));
		checkboxValue += parseInt(input.value);
		fValue = input.getAttribute('data-fvalue');
	});	

	if (checkboxValue === fValue){
		followUpList.push(questId);
	}

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
	let answerValue = 0;

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

function renderRecallQuestion(questId, optionText, questionValue, followUpVal){
	let MARKUP = ``;
	let qValue = questionValue;
	MARKUP = `<label class="checkbox"><input type="checkbox" name="question-${questId}" value="${qValue}" data-fvalue = "${followUpVal}"  data-text="${optionText}">${optionText}</label>`;
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