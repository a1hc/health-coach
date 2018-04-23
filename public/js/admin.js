import intializeDB from '../modules/db.js';
const db = intializeDB();

window.addEventListener('DOMContentLoaded', function () {
	firebase.auth().onAuthStateChanged(function(user) {
		if (user) {
			let userObj = {
				name: user.displayName,
		        email: user.email
    		};
 
    		var userRef = db.collection("users").doc(user.uid);
			userRef.get().then(function(doc) {
			    if (!doc.exists) {
			    	writeUserInfo(user.uid, userObj);
			    }
			    else{
			    	if(!doc.data().admin) {
			    		location.replace("index.html");
			    	}
			    	else{
			    		initializeView();
			    	}
			    }
			}).catch(function(error) {
			    console.log("Error getting document:", error);
			});

			document.querySelector("select").addEventListener('change', function(event) { loadResponse(event)}, false);

		} else {
			console.error("No one is signed in");
			location.replace("index.html");
		}
	});
});


function initializeView(){
	const signedUserId = firebase.auth().currentUser.uid;
	const usersRef = db.collection("users");

	usersRef.orderBy("name").get().then(function(querySnapshot) {
		querySnapshot.forEach(function(doc) {
			console.log(doc.id + " => ", doc.data());
			let userId = doc.id;
			let userName = doc.data().name; 

			//TODO: Remove these comments 
			//if(userId != signedUserId){
				document.querySelector("select#users").innerHTML += renderOption(userName, userId);
			//}
		});
	});
}

function loadResponse(event){
	const userId = event.target.value;
	const container = document.querySelector("#viewContainer");
	removeChildren(container);
	const questionRef =  db.collection("questionnaires");
	const enumRef = db.collection("enums").doc("priority");
	const surveyResultRef = db.collection("users").doc(userId).collection("response").doc("surveyResult");

	document.querySelector('#user-name').innerHTML = $("#users :selected").text();

	surveyResultRef.get().then(function(doc) {
		if (doc.exists){
			const surveyResult = doc.data();

			let tSummary = document.querySelector('#summary');
			tSummary.content.querySelector('#percentage').innerHTML = surveyResult.primaryResult + "/100";
			let clonedTemplate = document.importNode(tSummary.content, true);
			container.appendChild(clonedTemplate);

			enumRef.get().then(function(doc) {
				if(doc.exists){
					const priority = doc.data().values;
					console.log(priority);

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
				       				tQuestion.content.querySelector('td.questionNumCell').innerHTML = questNumber;
				       				tQuestion.content.querySelector('td.questionCell').innerHTML = questData.question;
					       			tQuestion.content.querySelector('td.responseCell').innerHTML = surveyResult.primary[questId].answerText;
					       			if(questData.questionType == 2){
										var value = surveyResult.primary[questId].answerValue.length * (questData.value/questData.choice.options.length);
										
										if(value > 0){
											tQuestion.content.querySelector('td.valueCell').innerHTML = value;
											$(tQuestion.content.querySelector('td.valueCell')).addClass("positiveCell");
										}
										else{
											tQuestion.content.querySelector('td.valueCell').innerHTML = value;
											$(tQuestion.content.querySelector('td.valueCell')).addClass("negativeCell");
										}
					       			}
					       			else{
					       				var value = surveyResult.primary[questId].answerValue;
					       				if(value > 0){
											tQuestion.content.querySelector('td.valueCell').innerHTML = value;
											$(tQuestion.content.querySelector('td.valueCell')).addClass("positiveCell");
										}
										else{
											tQuestion.content.querySelector('td.valueCell').innerHTML = value;
											$(tQuestion.content.querySelector('td.valueCell')).addClass("negativeCell");
										}
					       			}
					       			
					       			let clonedTemplate = document.importNode(tQuestion.content, true);
					       			sectionContainer.querySelector("tbody").appendChild(clonedTemplate);
					       			$(tQuestion.content.querySelector('td.valueCell')).removeClass("positiveCell negativeCell");

					       			let primaryQuestionId = questId;
					       			if(questData.followUp){
					       				questionSet.doc(primaryQuestionId).collection("subSet").get().then(function(subSnapShot) {
			       							subSnapShot.forEach(function(doc) {
			       								let questId = primaryQuestionId + doc.id;
							        			let questData = doc.data();
							        			let questLetter = (primaryQuestionId.charAt(1) + doc.id).toUpperCase();

												let tQuestion = document.querySelector('#responseRow');
												tQuestion.content.querySelector('td.questionNumCell').innerHTML = questLetter;
				       							tQuestion.content.querySelector('td.questionCell').innerHTML = questData.question;
				       							tQuestion.content.querySelector('td.valueCell').innerHTML = '';
				       							if(surveyResult.followUp[questId]){
				       								tQuestion.content.querySelector('td.responseCell').innerHTML = surveyResult.followUp[questId].answerText;
				       								if(questData.questionType == 4){
				       									let priorityValue = priority[surveyResult.followUp[questId].answerValue.priority];

				       									tQuestion.content.querySelector('td.priorityCell').innerHTML = priorityValue;

				       									switch(priorityValue){
															case "Low":
				       											$(tQuestion.content.querySelector('td.priorityCell')).addClass("priority-Low");
				       											break;
				       										case "Moderate":
				       											$(tQuestion.content.querySelector('td.priorityCell')).addClass("priority-Moderate");
				       											break;
				       										case "High":
				       											$(tQuestion.content.querySelector('td.priorityCell')).addClass("priority-High");
				       											break;
				       										default:
				       											tQuestion.content.querySelector('td.priorityCell').innerHTML = '';
				       											break;
				       									}
				       								}
				       								else{
				       									let priorityValue = priority[surveyResult.followUp[questId].answerValue];
				       									tQuestion.content.querySelector('td.priorityCell').innerHTML = priorityValue;
				       									switch(priorityValue){
															case "Low":
				       											$(tQuestion.content.querySelector('td.priorityCell')).addClass("priority-Low");
				       											break;
				       										case "Moderate":
				       											$(tQuestion.content.querySelector('td.priorityCell')).addClass("priority-Moderate");
				       											break;
				       										case "High":
				       											$(tQuestion.content.querySelector('td.priorityCell')).addClass("priority-High");
				       											break;
				       										default:
				       											tQuestion.content.querySelector('td.priorityCell').innerHTML = '';
				       											break;
				       									}
				       								}
				       							}
				       							else{
				       								tQuestion.content.querySelector('td.priorityCell').innerHTML = '';
				       								tQuestion.content.querySelector('td.responseCell').innerHTML = "N/A";
				       							}

					       						let clonedTemplate = document.importNode(tQuestion.content, true);
					       						sectionContainer.querySelector("tbody").appendChild(clonedTemplate);
					       						$(tQuestion.content.querySelector('td.priorityCell')).removeClass("priority-Low priority-Moderate priority-High");
			       							});
		       							});
				       				}
			       				});
			       			});
						});
					});
				}
			});
		} else {
			console.error("No such document!");
		}
	}).catch(function(error){
		console.error("Error getting document:", error);
	});
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


function renderOption(text, value){
	return `<option value="${value}" >${text}</label>`;
}
















