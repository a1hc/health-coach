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
		} else {
			console.error("No one is signed in");
			location.replace("index.html");
		}
	});
});


/* Writes User date to FireStore */
function writeUserInfo(uid, userObj){
    db.collection("users").doc(uid).set(userObj).then(function() {
        //console.log("Successfully created an account!");
    }).catch(function(error) {
        console.error("Error while writing document: ", error);
    });
}