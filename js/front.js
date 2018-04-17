

var c_backend_script = 'c';
if (window.location.protocol === 'https:') {
  // my certificate for https is registered via cokapi.com, so use it for now:
  var C_JSONP_ENDPOINT = 'https://cokapi.com:8001/exec_c_jsonp';
  
} else {
  
  var C_JSONP_ENDPOINT = 'http://104.237.139.253:3000/exec_c_jsonp'; // for deployment
  
}
function langToBackendScript(lang) {
  
      backend_script = c_backend_script;
       
      assert(backend_script);
  return backend_script;
              }
var isExecutingCode = false; 

var appMode = 'edit';

var pyInputCodeMirror; 
var pyInputAceEditor; 

var useCodeMirror = false; 
var prevExecutionExceptionObjLst = [];

var CODE_SNAPSHOT_DEBOUNCE_MS = 1000;
function generateUUID(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x7|0x8)).toString(16);
    });
    return uuid;
};

var sessionUUID = generateUUID(); // remains constant throughout one page load ("session")



if (typeof localStorage === 'object') {
    try {
        localStorage.setItem('localStorage', 1);
        localStorage.removeItem('localStorage');
    } catch (e) {
        Storage.prototype._setItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function() {};
        alert('Your web browser does not support storing settings locally. In Safari, the most common cause of this is using "Private Browsing Mode". Some settings may not save or some features may not work properly for you.');
    }
}
var dmp = new diff_match_patch();
var curCode = '';
var deltaObj = undefined;

function initDeltaObj() {
  if (!pyInputAceEditor && !pyInputCodeMirror) {
    return;
  }

  deltaObj = {start: pyInputGetValue(), deltas: [], v: 2,
              startTime: new Date().getTime()};}
  function initAceEditor(height) {
  pyInputAceEditor = ace.edit('codeInputPane');
  var s = pyInputAceEditor.getSession();
  // tab -> 4 spaces
  s.setTabSize(4);
  s.setUseSoftTabs(true);
  // disable extraneous indicators:
  s.setFoldStyle('manual'); // no code folding indicators
  s.getDocument().setNewLineMode('unix'); // canonicalize all newlines to unix format
  pyInputAceEditor.setHighlightActiveLine(false);
  pyInputAceEditor.setShowPrintMargin(false);
  pyInputAceEditor.setBehavioursEnabled(false);
  pyInputAceEditor.$blockScrolling = Infinity; // kludgy to shut up weird warnings

  // auto-grow height as fit
  pyInputAceEditor.setOptions({minLines: 18, maxLines: 1000});

  $('#codeInputPane').css('width', '700px');
  $('#codeInputPane').css('height', height + 'px'); // VERY IMPORTANT so that it works on I.E., ugh!

  initDeltaObj();
  pyInputAceEditor.on('change', function(e) {
    $.doTimeout('pyInputAceEditorChange', CODE_SNAPSHOT_DEBOUNCE_MS, snapshotCodeDiff); // debounce
    clearFrontendError();
    s.clearAnnotations();
  });
  s.setOption("useWorker", false);

  setAceMode();

  pyInputAceEditor.focus();
}

var CPP_BLANK_TEMPLATE = 'int main() {\n\
\n\
  return 0;\n\
}'
function setAceMode() {
  var selectorVal = $('#pythonVersionSelector').val();
  var mod;
  var tabSize = 2;
  var editorVal = $.trim(pyInputGetValue());

  if (editorVal === CPP_BLANK_TEMPLATE) {
    editorVal = '';
    pyInputSetValue(editorVal);
  }
 if (selectorVal === 'c') {
    mod = 'c_cpp';
    if (editorVal === '') {
      pyInputSetValue(CPP_BLANK_TEMPLATE);
    }
  }
  assert(mod);

  var s = pyInputAceEditor.getSession();
  s.setMode("ace/mode/" + mod);
  s.setTabSize(tabSize);
  s.setUseSoftTabs(true);

  // clear all error displays when switching modes
  var s = pyInputAceEditor.getSession();
  s.clearAnnotations();
  clearFrontendError();
}

function snapshotCodeDiff() {
  if (!deltaObj) {
    return;
  }

  var newCode = pyInputGetValue();
  var timestamp = new Date().getTime();

  //console.log('Orig:', curCode);
  //console.log('New:', newCode);
  if (curCode != newCode) {
    var diff = dmp.diff_toDelta(dmp.diff_main(curCode, newCode));
    //var patch = dmp.patch_toText(dmp.patch_make(curCode, newCode));
    var delta = {t: timestamp, d: diff};
    deltaObj.deltas.push(delta);

    curCode = newCode;
    logEventCodeopticon({type: 'editCode', delta: delta});

    if (typeof TogetherJS !== 'undefined' && TogetherJS.running) {
      TogetherJS.send({type: "editCode", delta: delta});
    }
  }
}

function reconstructCode() {
  var cur = '';

  var dmp = new diff_match_patch();
  var deltas = [];
  var patches = [];

  var prevTimestamp = undefined;
  $.each(deltaObj.deltas, function(i, e) {
    if (prevTimestamp) {
      assert(e.t >= prevTimestamp);
      prevTimestamp = e.t;
    }
    deltas.push(e.d);
    patches.push(e.p);
  });

  console.log(patches);
  console.log(deltas);

  
}

var myVisualizer = null; // singleton ExecutionVisualizer instance

var rawInputLst = []; // a list of strings inputted by the user in response to raw_input or mouse_input events


// each frontend must implement its own executeCode function
function executeCode() {
  alert("Configuration error. Need to override executeCode(). This is an empty stub.");
}

function redrawConnectors() {
  if (appMode == 'display' || appMode == 'visualize' /* deprecated */) {
    if (myVisualizer) {
      myVisualizer.redrawConnectors();
    }
  }
}

function setFronendError(lines) {
  $("#frontendErrorOutput").html(lines.map(htmlspecialchars).join('<br/>'));
}

function clearFrontendError() {
  $("#frontendErrorOutput").html('');
}


// From http://diveintohtml5.info/storage.html
function supports_html5_storage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}

// abstraction so that we can use either CodeMirror or Ace as our code editor
function pyInputGetValue() {
 
    return pyInputAceEditor.getValue();

}

function pyInputSetValue(dat) {
 
    pyInputAceEditor.setValue(dat.rtrim() /* kill trailing spaces */,
                              -1 /* do NOT select after setting text */);
  

  $('#urlOutput,#embedCodeOutput').val('');

  clearFrontendError();

  // also scroll to top to make the UI more usable on smaller monitors
  $(document).scrollTop(0);
}

function pyInputGetScrollTop() {
 
    return pyInputAceEditor.getSession().getScrollTop();
  
}

function pyInputSetScrollTop(st) {
    pyInputAceEditor.getSession().setScrollTop(st);
}


var num414Tries = 0; // hacky global

// run at the END so that everything else can be initialized first
function genericOptFrontendReady() {
  $(window).bind("hashchange", function(e) {
      var newMode = $.bbq.getState('mode');
     
      updateAppDisplay(newMode);

   
  });
    initAceEditor(420);
 
    pyInputAceEditor.getSession().on("change", function(e) {
      // unfortunately, Ace doesn't detect whether a change was caused
      // by a setValue call
      if (typeof TogetherJS !== 'undefined' && TogetherJS.running) {
        TogetherJS.send({type: "codemirror-edit"});
      }
    });

  if (supports_html5_storage()) {
    var lsKeys = ['cumulative',
                  'heapPrimitives',
                  'py',
                  'textReferences'];
    // restore toggleState if available
    var lsOptions = {};
    $.each(lsKeys, function(i, k) {
      var v = localStorage.getItem(k);
      if (v) {
        lsOptions[k] = v;
      }
    });
    setToggleOptions(lsOptions);

    // store in localStorage whenever user explicitly changes any toggle option:
    $('#cumulativeModeSelector,#heapPrimitivesSelector,#textualMemoryLabelsSelector,#pythonVersionSelector').change(function() {
      var ts = getToggleState();
      $.each(ts, function(k, v) {
        localStorage.setItem(k, v);
      });
    });

    if (!localStorage.getItem('opt_uuid')) {
      localStorage.setItem('opt_uuid', generateUUID());
    }
  }
  $(window).resize(redrawConnectors);

  $('#genUrlBtn').bind('click', function() {
    //var myArgs = getAppState();
    var urlStr = $.param.fragment(window.location.href, myArgs, 2 /* clobber all */);
    urlStr = urlStr.replace(/\)/g, '%29') // replace ) with %29 so that links embed well in Markdown
    $('#urlOutput').val(urlStr);
  });


  // register a generic AJAX error handler
  $(document).ajaxError(function(evt, jqxhr, settings, exception) {
    // ignore errors related to togetherjs stuff:
    if (settings.url.indexOf('togetherjs') > -1) {
      return; // get out early
    }

    // ugh other idiosyncratic stuff
    if (settings.url.indexOf('name_lookup.py') > -1) {
      return; // get out early
    }

    if (settings.url.indexOf('syntax_err_survey.py') > -1) {
      return; // get out early
    }

    if (settings.url.indexOf('viz_interaction.py') > -1) {
      return; // get out early
    }

  
    if (jqxhr && jqxhr.responseText.indexOf('414') >= 0) {
      if (num414Tries === 0) {
        num414Tries++;
        startExecutingCode(); // TODO: does this work?
        $("#executeBtn").click();
      } else {
        num414Tries = 0;
        setFronendError(["Server error! Your code might be too long for this tool. Shorten your code and re-try."]);
      }
    } else {
      setFronendError(["",
                       ]);
    }

    doneExecutingCode();
  });

  clearFrontendError();

  $("#embedLinkDiv").hide();
  $("#executeBtn").attr('disabled', false);
  $("#executeBtn").click(executeCodeFromScratch);
  $(window).on('beforeunload', function(){
    submitUpdateHistory('beforeunload');
    // don't return anything, or a modal dialog box might pop up
  });

  // just do this as well, even though it might be hella redundant
  $(window).unload(function(){
    submitUpdateHistory('unload');
    // don't return anything, or a modal dialog box might pop up
  });

  var lastSubmittedUpdateHistoryLength = 0;
  setInterval(function() {
    if (myVisualizer) {
      var uh = myVisualizer.updateHistory;
      // don't submit identical entries repeatedly since that's redundant
      if (uh && (uh.length != lastSubmittedUpdateHistoryLength)) {
        lastSubmittedUpdateHistoryLength = uh.length;
        submitUpdateHistory('periodic');
      }
    }
  }, 1000 * 60);
}

function setToggleOptions(dat) {
  // ugh, ugly tristate due to the possibility of each being undefined
  if (dat.py !== undefined) {
    $('#pythonVersionSelector').val(dat.py);
  }
  if (dat.cumulative !== undefined) {
    $('#cumulativeModeSelector').val(dat.cumulative);
  }
  if (dat.heapPrimitives !== undefined) {
    $('#heapPrimitivesSelector').val(dat.heapPrimitives);
  }
  if (dat.textReferences !== undefined) {
    $('#textualMemoryLabelsSelector').val(dat.textReferences);
  }
}
function updateAppDisplay(newAppMode) {
  // idempotence is VERY important here
  if (newAppMode == appMode) {
    return;
  }

  appMode = newAppMode; // global!

  if (appMode === undefined || appMode == 'edit' ||
      !myVisualizer /* subtle -- if no visualizer, default to edit mode */) {
    appMode = 'edit'; // canonicalize

    $("#pyInputPane").show();
    $("#pyOutputPane").hide();
    $("#embedLinkDiv").hide();

    $(".surveyQ").val(''); // clear all survey results when user hits forward/back

    // destroy all annotation bubbles (NB: kludgy)
    if (myVisualizer) {
      myVisualizer.destroyAllAnnotationBubbles();
    }

    $("#pyOutputPane").empty();
    // right before destroying, submit the visualizer's updateHistory
    submitUpdateHistory('editMode');
    myVisualizer = null;

    $(document).scrollTop(0); // scroll to top to make UX better on small monitors

    var s = { mode: 'edit' };
    // keep these persistent so that they survive page reloads
    // keep these persistent so that they survive page reloads
    if (typeof codeopticonSession !== "undefined") {s.cosession = codeopticonSession;}
    if (typeof codeopticonUsername !== "undefined") {s.couser = codeopticonUsername;}
    $.bbq.pushState(s, 2 /* completely override other hash strings to keep URL clean */);
  }
  else if (appMode == 'display' || appMode == 'visualize' /* 'visualize' is deprecated */) {
    assert(myVisualizer);
    appMode = 'display'; // canonicalize

    $("#pyInputPane").hide();
    $("#pyOutputPane").show();
    $("#embedLinkDiv").show();

    if (typeof TogetherJS === 'undefined' || !TogetherJS.running) {
      $("#surveyHeader").show();
    }

    doneExecutingCode();

    // do this AFTER making #pyOutputPane visible, or else
    // jsPlumb connectors won't render properly
    myVisualizer.updateOutput();

    // customize edit button click functionality AFTER rendering (NB: awkward!)
    $('#pyOutputPane #editCodeLinkDiv').show();
    $('#pyOutputPane #editBtn').click(function() {
      enterEditMode();
    });
    var v = $('#pythonVersionSelector').val();
    if (v === 'js' || v === '2' || v === '3') {
      //var myArgs = getAppState();
      var urlStr = $.param.fragment('live.html', myArgs, 2 /* clobber all */);
      $("#pyOutputPane #liveModeSpan").show();
      $('#pyOutputPane #editLiveModeBtn').click(function() {
        //var myArgs = getAppState();
        var urlStr = $.param.fragment('live.html', myArgs, 2 /* clobber all */);
        window.open(urlStr); // open in new tab

        return false; // to prevent default "a href" click action
      });
    } else {
      $("#pyOutputPane #liveModeSpan").hide();
    }

    $(document).scrollTop(0); // scroll to top to make UX better on small monitors


    // NASTY global :(
    if (pendingCodeOutputScrollTop) {
      myVisualizer.domRoot.find('#pyCodeOutputDiv').scrollTop(pendingCodeOutputScrollTop);
      pendingCodeOutputScrollTop = null;
    }

    $.doTimeout('pyCodeOutputDivScroll'); // cancel any prior scheduled calls

    // TODO: this might interfere with experimentalPopUpSyntaxErrorSurvey (2015-04-19)
    myVisualizer.domRoot.find('#pyCodeOutputDiv').scroll(function(e) {
      var elt = $(this);
      // debounce
      $.doTimeout('pyCodeOutputDivScroll', 100, function() {
        // note that this will send a signal back and forth both ways
        if (typeof TogetherJS !== 'undefined' && TogetherJS.running) {
          // (there's no easy way to prevent this), but it shouldn't keep
          // bouncing back and forth indefinitely since no the second signal
          // causes no additional scrolling
          TogetherJS.send({type: "pyCodeOutputDivScroll",
                           scrollTop: elt.scrollTop()});
        }
      });
    });

    var s = { mode: 'display' };
    // keep these persistent so that they survive page reloads
    if (typeof codeopticonSession !== "undefined") {s.cosession = codeopticonSession;}
    if (typeof codeopticonUsername !== "undefined") {s.couser = codeopticonUsername;}
    $.bbq.pushState(s, 2 /* completely override other hash strings to keep URL clean */);
  }
  else {
    assert(false);
  }

  $('#urlOutput,#embedCodeOutput').val(''); // clear to avoid stale values
}
function executeCodeFromScratch() {
  // don't execute empty string:
  if ($.trim(pyInputGetValue()) == '') {
    setFronendError(["Type in some code to visualize."]);
    return;
  }

  rawInputLst = []; // reset!
  executeCode();
}

function executeCodeWithRawInput(rawInputStr, curInstr) {
  rawInputLst.push(rawInputStr);
  console.log('executeCodeWithRawInput', rawInputStr, curInstr, rawInputLst);
  executeCode(curInstr);
}


function handleUncaughtExceptionFunc(trace) {
  if (trace.length == 1 && trace[0].line) {
    var errorLineNo = trace[0].line - 1; /* CodeMirror lines are zero-indexed */
    if (errorLineNo !== undefined && errorLineNo != NaN) {
      // highlight the faulting line
       
        var s = pyInputAceEditor.getSession();
        s.setAnnotations([{row: errorLineNo,
                           type: 'error',
                           text: trace[0].exception_msg}]);
        pyInputAceEditor.gotoLine(errorLineNo + 1 /* one-indexed */);
      
        if (trace[0].col !== undefined) {
          pyInputAceEditor.moveCursorTo(errorLineNo, trace[0].col);
        }
        pyInputAceEditor.focus();
      
    }
  }
}

function startExecutingCode() {
  $('#executeBtn').html("Please wait ... executing (takes up to 10 seconds)");
  $('#executeBtn').attr('disabled', true);
  isExecutingCode = true; // nasty global
}

function doneExecutingCode() {
  $('#executeBtn').html("Visualize Execution");
  $('#executeBtn').attr('disabled', false);
  isExecutingCode = false; // nasty global
}


function enterDisplayMode() {
  updateAppDisplay('display');
}

function enterEditMode() {
  updateAppDisplay('edit');
}
function optFinishSuccessfulExecution() {
  enterDisplayMode(); // do this first!
  myVisualizer.creationTime = new Date().getTime();
  myVisualizer.updateHistory = [];
  myVisualizer.updateHistory.push([myVisualizer.curInstr,
                                   myVisualizer.creationTime,
                                   myVisualizer.curTrace.length]);
  initializeDisplayModeSurvey();

  if (typeof(activateSyntaxErrorSurvey) !== 'undefined' &&
      activateSyntaxErrorSurvey &&
      experimentalPopUpSyntaxErrorSurvey) {
    experimentalPopUpSyntaxErrorSurvey();
  }
}
function executeCodeAndCreateViz(codeToExec,
                                 backendScript, backendOptionsObj,
                                 frontendOptionsObj,
                                 outputDiv,
                                 handleSuccessFunc, handleUncaughtExceptionFunc) {

    function execCallback(dataFromBackend) {
      var trace = dataFromBackend.trace;

      var killerException = null;

      // don't enter visualize mode if there are killer errors:
      if (!trace ||
          (trace.length == 0) ||
          (trace[trace.length - 1].event == 'uncaught_exception')) {

        handleUncaughtExceptionFunc(trace);

        if (trace.length == 1) {
          killerException = trace[0]; // killer!
          setFronendError([trace[0].exception_msg]);
        }
        else if (trace.length > 0 && trace[trace.length - 1].exception_msg) {
          killerException = trace[trace.length - 1]; // killer!
          setFronendError([trace[trace.length - 1].exception_msg]);
        }
        else {
          setFronendError(["Unknown error"]);
        }
      }
      else {
        // fail-soft to prevent running off of the end of trace
        if (frontendOptionsObj.startingInstruction >= trace.length) {
          frontendOptionsObj.startingInstruction = 0;
        }

        if (frontendOptionsObj.runTestCaseCallback) {
          // hacky! DO NOT actually create a visualization! instead call:
          frontendOptionsObj.runTestCaseCallback(trace);
        } else {
          myVisualizer = new ExecutionVisualizer(outputDiv, dataFromBackend, frontendOptionsObj);

          myVisualizer.add_pytutor_hook("end_updateOutput", function(args) {
            if (updateOutputSignalFromRemote) {
              return;
            }
            
            // debounce to compress a bit ... 250ms feels "right"
            $.doTimeout('updateOutputLogEvent', 250, function() {
              var obj = {type: 'updateOutput', step: args.myViz.curInstr,
                         curline: args.myViz.curLineNumber,
                         prevline: args.myViz.prevLineNumber};
              // optional fields
              if (args.myViz.curLineExceptionMsg) {
                obj.exception = args.myViz.curLineExceptionMsg;
              }
              if (args.myViz.curLineIsReturn) {
                obj.curLineIsReturn = true;
              }
              if (args.myViz.prevLineIsReturn) {
                obj.prevLineIsReturn = true;
              }
              logEventCodeopticon(obj);
            });

            // 2014-05-25: implemented more detailed tracing for surveys
            if (args.myViz.creationTime) {
              var curTs = new Date().getTime();

              var uh = args.myViz.updateHistory;
              assert(uh.length > 0); // should already be seeded with an initial value
              if (uh.length > 1) { // don't try to "compress" the very first entry
                var lastTs = uh[uh.length - 1][1];
                // (debounce entries that are less than 1 second apart to
                // compress the logs a bit when there's rapid scrubbing or scrolling)
                if ((curTs - lastTs) < 1000) {
                  uh.pop(); // get rid of last entry before pushing a new entry
                }
              }
              uh.push([args.myViz.curInstr, curTs]);
            }
            return [false]; // pass through to let other hooks keep handling
          });
        }
        if (myVisualizer) {
          myVisualizer.backendOptionsObj = backendOptionsObj;
        }

        handleSuccessFunc();
       
      }

      doneExecutingCode(); 
      if (originFrontendJsFile !== 'iframe-embed.js') {
        logEventCodeopticon({type: 'doneExecutingCode',
                  backendDataJSON: JSON.stringify(dataFromBackend), // for easier transport and compression
                  frontendOptionsObj: frontendOptionsObj,
                  backendOptionsObj: backendOptionsObj,
                  killerException: killerException, // if there's, say, a syntax error
                  });
      }

      if (killerException && (originFrontendJsFile !== 'iframe-embed.js')) {
        prevExecutionExceptionObjLst.push(excObj);
      } else {
        prevExecutionExceptionObjLst = []; // reset!!!
      }
      num414Tries = 0;
    }

    if (!backendScript) {
      setFronendError(["Server configuration error: No backend script",
                       ]);
      return;
    }


    snapshotCodeDiff(); // do ONE MORE snapshot before we execute, or else
                        // we'll miss a diff if the user hits Visualize Execution
                        // very shortly after finishing coding
    if (deltaObj) {
      deltaObj.executeTime = new Date().getTime();
    }
    enterEditMode();
    clearFrontendError();
    startExecutingCode();

    jsonp_endpoint = null;
    if (backendScript === c_backend_script) {
      frontendOptionsObj.lang = 'c';
      jsonp_endpoint = C_JSONP_ENDPOINT;
    } 
    var deltaObjStringified = (deltaObj && (deltaObj.deltas.length > 0)) ? JSON.stringify(deltaObj) : null;
    if (deltaObjStringified) {
      if (deltaObjStringified.length > 4096) {
        deltaObjStringified = "overflow";
      }
    } else {
      if (num414Tries > 0) {
        deltaObjStringified = "overflow_414";
      }
    }
    if (
        backendScript === c_backend_script ) {
      $.get(backendScript,
            {user_script : codeToExec,
             options_json: JSON.stringify(backendOptionsObj),
             user_uuid: supports_html5_storage() ? localStorage.getItem('opt_uuid') : undefined,
             session_uuid: sessionUUID,
             diffs_json: deltaObjStringified},
             function(dat) {} /* don't do anything since this is a dummy call */, "text");
      assert(jsonp_endpoint);
      $.ajax({
        url: jsonp_endpoint,
        // The name of the callback parameter, as specified by the YQL service
        jsonp: "callback",
        dataType: "jsonp",
        data: {user_script : codeToExec,
               options_json: JSON.stringify(backendOptionsObj)},
        success: execCallback,
      });
    } 

    initDeltaObj(); // clear deltaObj to start counting over again
}
function compressUpdateHistoryList(myVisualizer) {
  assert(myVisualizer);
  var uh = myVisualizer.updateHistory;
  var encodedUh = [];
  if (uh) {
    encodedUh.push(uh[0]);

    var firstTs = uh[0][1];
    for (var i = 1; i < uh.length; i++) {
      var e = uh[i];
      encodedUh.push([e[0], e[1] - firstTs]);
    }

    // finally push a final entry with the current timestamp delta
    var curTs = new Date().getTime();
    encodedUh.push([myVisualizer.curInstr, curTs - firstTs]);
  }
  return encodedUh;
}

//var survey_html = survey_v8;
function setSurveyHTML() {
 // $('#surveyPane').html(survey_html);
}
function getSurveyObject() {
  
  return null;
}



