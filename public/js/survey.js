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
    		writeUserInfo(user.uid, userObj);

    		const surveyBtn = document.querySelector('.surveyBtn');
    		surveyBtn.addEventListener('click', function(event) { initalizeSurvey(event)}, false);
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

	const mQRef = db.collection("questionnaires").doc("morality");
	const questionSet = db.collection("questionnaires").doc("morality").collection("set");

	 db.collection("questionnaires").get().then(function(querySnapshot) {
	    querySnapshot.forEach(function(doc) {
	        // doc.data() is never undefined for query doc snapshots
	        console.log(doc.id, " => ", doc.data());
	        

	    });
	});

	questionSet.get().then(function(querySnapshot) {
	    querySnapshot.forEach(function(doc) {
	        // doc.data() is never undefined for query doc snapshots
	        console.log(doc.id, " => ", doc.data());
	        
	        let questId = doc.id;
	        let questData = doc.data();
	        let questValue = questData.value;
	        var container = document.querySelector("#survey-container");

	        if(questData.binaryQuestion){
	        	let tBinary = document.querySelector('#binaryTemp');
	        	tBinary.content.querySelector('p').innerHTML = questData.question;
	        	tBinary.content.querySelector('p').setAttribute('id', questId);
	        	let optionMARKUP = ``;
	        	questData.choice.options.forEach(function(option){
	        		optionMARKUP += renderBinaryQuestion(questId, option.optionValue, questValue, option.isPositive);
	        	});

	        	tBinary.content.querySelector('div.options').innerHTML = optionMARKUP;
	        	let clonedTemplate = document.importNode(tBinary.content, true);
	        	container.appendChild(clonedTemplate);

	        }
	        else{
	        	console.log("Not a binary question.")
	        }

	    });
	});
}


function renderBinaryQuestion(questId, optionText, questionValue, isPositive){
	let MARKUP =``;
	let qValue = questionValue;
	if(!isPositive){
		qValue = -questionValue;
	}
	console.log(qValue);
	MARKUP = `<label class="radio-inline"><input type="radio" name="question-${questId}" value="${qValue}" required>${optionText}</label>`;
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