var readline = require('readline');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("I am thinking of a number between 1 and 10");

askQuestion("Take a guess");

var number = Math.floor((Math.random()*10)+1);

function askQuestion(question){
    rl.question(question + "\n", function(answer) {
        if(answer == number) {
            console.log("Well done! The answer was %s", answer);
            rl.close();
        } else if(answer < number) {
            askQuestion("Too low, Guess again");
        } else {
            askQuestion("Too high, Guess again");
        }

    });
}
