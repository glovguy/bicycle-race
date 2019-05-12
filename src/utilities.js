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
exports.debounce = debounce;

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

function moveSVGtoPoint(svgStr, moveX, moveY) {
  const arr = svgStr.split(/([A-Z])/).splice(1);
  for (i=0; i < arr.length; i=i+2) {
    if (arr[i] === 'Z' || arr[i] === 'z') { continue; } // Z command has no coordinates associated
    let pointArr = arr[i+1].split(' ');
    for (p=0; p < pointArr.length; p=p+2) {
      pointArr[p] = String(moveX + parseFloat(pointArr[p]));
      pointArr[p+1] = String(moveY + parseFloat(pointArr[p+1]));
    }
    arr[i+1] = pointArr.join(' ');
  }
  const arrOut = arr.join('');
  return arrOut;
}
exports.moveSVGtoPoint = moveSVGtoPoint;

function pipe(...fns) {
  return function(x) { return fns.reduce((y, f) => f(y), x); };
}
exports.pipe = pipe;
