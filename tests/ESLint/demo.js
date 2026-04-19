//Demo ESLint

const unusedVariable = "HelloWorld";

function calculateScore(a, b) {
  if (a == b) {
    // Báo lỗi: vi phạm luật eqeqeq
    console.log("Equal");
  }
  return a + b;
}

calculateScore(10, "10");
