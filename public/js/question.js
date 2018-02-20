$(document).ready(function(){
	$( "#nextBtn" ).on( "click", next );
	$( "#backBtn" ).on( "click", prev );
	$( "label.popMessage").on("click", modalMessage);

	for(i = 1; i <= QUESTIONS.number; i++){
		$("button#q-" + i).on("click", navigate);
	}
	$("form input").on("change", updateResponse);

    $("#message").on('hide.bs.modal', function(){
        var videoIFrame = $(this).find("iframe");
        var videoSrc = videoIFrame.attr('src');
        videoIFrame.attr('src', '');
        videoIFrame.attr('src', videoSrc);
    });
});

//Update User Response
function updateResponse(){
	Qnum = getQuestion();
	if(Qnum < 0 || Qnum > 4) return false;
	QType = QUESTIONS[Qnum];
	const formName = "questionnaire";
	const form = document.forms[formName];
	const userInput = form.elements[QType].value;
	
	INPUT[QType] = userInput;
	console.log(INPUT);
}

function modalMessage(){
	$this = $(this);
	const qType = ($this.find("input").attr("name"));
	const response = $this.find("input").val();
	switch(qType){
		case QTYPE.BREAKFAST:
			if(response === "yes"){
				$('#message').modal('toggle');
				$("#message .modal-title").text("Breakfast Can Help");
				$("#message .modal-body p").text("Yes! Eating breakfast can boost your metabolism.");
				$("#video").hide();
			}
			break;
		case QTYPE.SLEEP:
			if(response === "yes"){
				$('#message').modal('toggle');
				$("#message .modal-title").text("Sleeping Enough Can Help");
				$("#message .modal-body p").text("Yes! You are getting the healthy amount of sleep.");
				$("#video").hide();
			}
			break;
		case QTYPE.EXERCISEHR:
			if(response === "0-5" && INPUT.gender === "male" && INPUT.sleep === "no"){
				$('#message').modal('toggle');
				$("#message .modal-title").text("Let's talk!");
				$("#message .modal-body p").text("You and I should talk. Let’s schedule a consultation.");
				$("#video").hide();
			}
			displaySuggestion();
			break;
		default:
	}
}

function displaySuggestion(){

	var display = false;
	/* Check whether all inputs are valid */ 
	for (var key in INPUT) {
		if(key === null || key === undefined) return false;
	}

	$("#video").hide();
	$("#product").hide();

	if(INPUT.breakfast === "no"){
		if(INPUT.gender === "female"){
			display = true;
			$("#youTubeVideo p").text("You have a fairly good diet. I think you might like this video: <Test Video 1>");
			var videoIFrame = $('#suggestion').find("iframe");
			var videoSrc = videoIFrame.attr('src');
			videoIFrame.attr('src', 'https://www.youtube.com/embed/QG5Wiy_X4Yk');	
			$("#video").show();
		}
		else{
			display = true;
			$("#youTubeVideo p").text("You have a fairly good diet. I think you might like this video: <Test Video 2>");
			var videoIFrame = $('#suggestion').find("iframe");
			var videoSrc = videoIFrame.attr('src');
			videoIFrame.attr('src', 'https://www.youtube.com/embed/QG5Wiy_X4Yk');	
			$("#video").show();
		}
	}

	if(INPUT.sleep === "no"){
		if(INPUT.gender === "male"){
			display = true;
			$("#product p").text("Sleep does wonders! I think you might like this <http://www.rxfitpro.com/product/antense/>.");
			$("#product").show();	
		}
	}

	if(display) {
		$('#suggestion').modal('toggle');
	}

	return true;

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
	"gender" : null,
	"breakfast" : null,
	"sleep" : null,
	"exercise": null
};

const QUESTIONS = {
	"number" : 4,
	"1" : "gender",
	"2" : "breakfast",
	"3" : "sleep",
	"4" : "exercise"
}

const QTYPE ={
	"BREAKFAST" : "breakfast",
	"SLEEP" : "sleep",
	"EXERCISEHR" : "exercise"
}