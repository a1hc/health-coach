export default function intializeDB(){
	var config = {
	    apiKey: "AIzaSyCKirmmwo85IVUw9z0diqxs0duY72c05vw",
	    authDomain: "a1hc-9bf44.firebaseapp.com",
	    databaseURL: "https://a1hc-9bf44.firebaseio.com",
	    projectId: "a1hc-9bf44",
	    storageBucket: "a1hc-9bf44.appspot.com",
	    messagingSenderId: "987235951797"
	  };
	firebase.initializeApp(config);
	return firebase.firestore(); 	
}