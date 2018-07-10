window.requestAnimFrame = (function(callback){
  return  window.requestAnimationFrame  ||
    window.webkitRequestAnimationFrame  ||
    window.mozRequestAnimationFrame     ||
    function(callback){
      window.setTimeout(callback, 20);
    };
})();

const debounce = (func, wait, immediate) => {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

function readTextFile(srcfile) {
  try { //this is for IE
    var fso = new ActiveXObject("Scripting.FileSystemObject");;
    if (fso.FileExists(srcfile)) {
      var fileReader = fso.OpenTextFile(srcfile, 1);
      var line = fileReader.ReadLine();
      var jsonOutput = JSON.parse(line);
    }
  } catch (e) {}
}

(function() {
  if ( typeof Object.id == "undefined" ) {
    var id = 0;

    Object.id = function(o) {
      if ( typeof o.__uniqueid == "undefined" ) {
        Object.defineProperty(o, "__uniqueid", {
          value: ++id,
          enumerable: false,
          // This could go either way, depending on your
          // interpretation of what an "id" is
          writable: false
        });
      }

      return o.__uniqueid;
    };
  }
})();

function consistentForIterations(arr, label, iter) {
  if (arr.length < iter) { return false; }
  for (let i=1; i<iter; i++) {
    if (arr[arr.length-i][label] !== arr[arr.length-i-1][label]) { return false };
  }
  return true;
}
