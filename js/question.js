$(document).ready(function(){
	$( "#nextBtn" ).on( "click", next );
	$( "#backBtn" ).on( "click", prev );
	$( "label.popMessage").on("click", modalMessage);

	for(i = 1; i <= QUESTIONS.number; i++){
		$("button#q-" + i).on("click", navigate);
	}
});

function modalMessage(){
	$this = $(this);
	const qType = ($this.find("input").attr("name"));
	const response = $this.text();
	switch(qType){
		case QTYPE.BREAKFAST:
			if(response === "Yes"){
				$(".modal-title").text("Breakfast Can Help");
				$(".modal-body").text("Yes! Eating breakfast can boost your metabolism.");
			}
			else{
				$(".modal-body").text("Place Holder");
			}
			break;
		case QTYPE.SLEEP:
			if(response === "Yes"){
				$(".modal-title").text("Sleeping Enough Can Help");
				$(".modal-body").text("Yes! You are getting the healthy amount of sleep.");
			}
			else{
				$(".modal-body").text("Place Holder");
			}
			break;
		case QTYPE.EXERCISEHR:
			if(response === "0-5 Hours"){
				$(".modal-title").text("Exercising Can Help");
				$(".modal-body").text("Yes! Exercising can improve your physical strength and fitness!");
			}
			else{
				$(".modal-title").text("Exercising Can Help");
				$(".modal-body").text("Yes! Exercising can improve your physical strength and fitness!");
			}
			break;
		default:
	}
}

function navigate(){
	const currQ = getQuestion();
	const nextQ = ($(this).attr('id').split("-")[1]);
	if(nextQ != currQ) switchQuestion(currQ, nextQ);
}

/* Shows the next question */
function next(){
	Qnum = getQuestion();
	nextQ = parseInt(Qnum)+1;
	switchQuestion(Qnum, nextQ);
}

/* Shows the previous question */ 
function prev(){
	Qnum = getQuestion();
	prevQ = parseInt(Qnum)-1;
	switchQuestion(Qnum, prevQ);
}

function switchQuestion(currQnum, intendQnum){
	if(verify(currQnum)){
		const currBtnQuery=".stepwizard-step button#q-" + currQnum;
		const intendBtnQuery=".stepwizard-step button#q-" + intendQnum;
		const activeBtn = document.querySelector(currBtnQuery);

		if(activeBtn){
			$(currBtnQuery).removeClass("active");
			$(intendBtnQuery).prop("disabled", false);
			$(intendBtnQuery).addClass("active");
			hideQuestion(currQnum);
			displayQuestion(intendQnum);

			if(parseInt(intendQnum) === 1){
				$("button#backBtn").css('visibility', 'hidden');
			}
			else{
				$("button#backBtn").css('visibility', 'visible');
			}

			if(parseInt(intendQnum) === 4){
				$("button#nextBtn").css('visibility', 'hidden');
			}
			else{
				$("button#nextBtn").css('visibility', 'visible');
			}

		}
		else{
			console.error("Progress bar button could not be retrieved.");
			return false;
		}
	}
	return true;
}

function verify(Qnum){
	const query = ".question" +Qnum+ " label.active";
	activeBtn = document.querySelector(query);
	if(activeBtn == null){
		alert("Please select one of the options.");
		return false;
	}
	return true;
}

function hideQuestion(Qnum){
	$(".question" + Qnum).hide();
}

function displayQuestion(Qnum){
	$(".question" + Qnum).show();
}

/* Retrieves the active question number */ 
function getQuestion(){
	const query = ".stepwizard-step button.active";
	question = document.querySelector(query);
	if(question) {
		id = question.id;
		return(id.split("-")[1]);
	}
	else console.error("Error found while retrieving the question information.");
}

const INPUT = {
	"gender" : "",
	"eatBreakfast" : false,
	"sleepGreater" : false,
	"exerciseGreater": false
};

const QUESTIONS = {
	"number" : 4
}

const QTYPE ={
	"BREAKFAST" : "breakfast",
	"SLEEP" : "sleep",
	"EXERCISEHR" : "exercise"
}