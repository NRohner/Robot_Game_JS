var character = document.getElementsById("character");
var block = document.getElementById("block");

// Creating a jump function
function jump(){
    if(character.classList != "animate"){
        character.classList.add("animate"); // This is what actually adds the class "jump" to the character
    }
    
    setTimeout(function(){character.classList.remove("animate");
    },500);
}
