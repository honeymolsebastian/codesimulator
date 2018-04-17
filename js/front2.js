
var originFrontendJsFile = 'opt-frontend.js';

var activateSyntaxErrorSurvey = true; // true;



function getBaseBackendOptionsObj() {
  console.log("an getBaseBackendOptionsObj");
  var ret = {cumulative_mode: ($('#cumulativeModeSelector').val() == 'true'),
             heap_primitives: ($('#heapPrimitivesSelector').val() == 'true'),
             show_only_outputs: false,
             py_crazy_mode: ($('#pythonVersionSelector').val() == '2crazy'),
             origin: originFrontendJsFile};

  var surveyObj = getSurveyObject();
  if (surveyObj) {
    ret.survey = surveyObj;
  }

  return ret;
}

function getBaseFrontendOptionsObj() {
  console.log("an getBaseFrontendOptionsObj");
  var ret = {// tricky: selector 'true' and 'false' values are strings!
              disableHeapNesting: ($('#heapPrimitivesSelector').val() == 'true'),
              textualMemoryLabels: ($('#textualMemoryLabelsSelector').val() == 'true'),
              executeCodeWithRawInputFunc: executeCodeWithRawInput,

              // always use the same visualizer ID for all
              // instantiated ExecutionVisualizer objects,
              // so that they can sync properly across
              // multiple clients using TogetherJS. this
              // shouldn't lead to problems since only ONE
              // ExecutionVisualizer will be shown at a time
              visualizerIdOverride: '1',
              updateOutputCallback: function() {$('#urlOutput,#embedCodeOutput').val('');},

              // undocumented experimental modes:
              pyCrazyMode: ($('#pythonVersionSelector').val() == '2crazy'),
              holisticMode: ($('#cumulativeModeSelector').val() == 'holistic')
            };
  return ret;
}

function executeCode(forceStartingInstr, forceRawInputLst) {
  console.log("an executeCode");
  if (forceRawInputLst !== undefined) {
    rawInputLst = forceRawInputLst; // UGLY global across modules, FIXME
  }

  var backend_script = langToBackendScript($('#pythonVersionSelector').val());
  var backendOptionsObj = getBaseBackendOptionsObj();

  var startingInstruction = forceStartingInstr ? forceStartingInstr : 0;

  var frontendOptionsObj = getBaseFrontendOptionsObj();
  frontendOptionsObj.startingInstruction = startingInstruction;

  executeCodeAndCreateViz(pyInputGetValue(),
                          backend_script, backendOptionsObj,
                          frontendOptionsObj,
                          'pyOutputPane',
                          optFinishSuccessfulExecution, handleUncaughtExceptionFunc);
}


// domID is the ID of the element to attach to (without the leading '#' sign)
function SyntaxErrorSurveyBubble(parentViz, domID) {
  console.log("an SyntaxErrorSurveyBubble");
  this.parentViz = parentViz;

  this.domID = domID;
  this.hashID = '#' + domID;

  this.my = 'left center';
  this.at = 'right center';

  this.qtipHidden = false; // is there a qtip object present but hidden? (TODO: kinda confusing)
}

SyntaxErrorSurveyBubble.prototype.destroyQTip = function() {
  console.log("an SyntaxErrorSurveyBubble.prototype.destroyQTip");
  $(this.hashID).qtip('destroy');
}

SyntaxErrorSurveyBubble.prototype.redrawCodelineBubble = function() {
  console.log("an SyntaxErrorSurveyBubble.prototype.redrawCodelineBubble");
  if (isOutputLineVisibleForBubbles(this.domID)) {
    if (this.qtipHidden) {
      $(this.hashID).qtip('show');
    }
    else {
      $(this.hashID).qtip('reposition');
    }

    this.qtipHidden = false;
  }
  else {
    $(this.hashID).qtip('hide');
    this.qtipHidden = true;
  }
}

SyntaxErrorSurveyBubble.prototype.qTipContentID = function() {
  return '#ui-tooltip-' + this.domID + '-content';
}

SyntaxErrorSurveyBubble.prototype.qTipID = function() {
  return '#ui-tooltip-' + this.domID;
}


// created on 2015-04-18



function initAceAndOptions() {
  console.log("an initAceAndOptions");
  var v = $('#pythonVersionSelector').val();
  if (v === 'java') {
    $("#javaOptionsPane").show();
  } else {
    $("#javaOptionsPane").hide();
  }
  setAceMode(); // update syntax highlighting mode

  if (v === 'js' || v === '2' || v === '3') {
    $("#liveModeBtn").show();
  } else {
    $("#liveModeBtn").hide();
  }
}




$(document).ready(function() {
  console.log("an document).ready");
  setSurveyHTML();

 

  // canned examples
  
  $('#pythonVersionSelector').change(initAceAndOptions);
  genericOptFrontendReady(); // initialize at the end


  // deployed on 2015-03-12, taken down on 2015-03-16
  //$("#surveyHeader").html('<a href="http://45.56.123.166/~mgordon/OnlinePythonTutor/v3/embedding-demo.html?session=fvkqv4423mcxr" target="_blank">Click here to help our research</a> by collaboratively annotating<br/>a piece of Python code to create a tutorial for beginners.');
  //$("#surveyHeader").css('font-size', '12pt');

  // run this AFTER genericOptFrontendReady so that opt_uuid is already
  // set by now
  var myUuid = supports_html5_storage() ? localStorage.getItem('opt_uuid') : '';
  // deployed on 2015-03-19, added opt_uuid param on 2015-03-20
  // taken down on 2015-05-14
  //$("#surveyHeader")
  //  .html('<iframe width="820" height="120" frameborder="0" src="http://45.56.123.166/~mgordon/OnlinePythonTutor/v3/embedding-demo-blur-frame.html?opt_uuid=' + myUuid + '"></iframe>')
  //  .css('margin-bottom', '10px');


  initAceAndOptions(); // do this after genericOptFrontendReady

});
