<?php

$food = "data/food.csv";
$nutrient = "data/nutrient.csv";
$food_nutrient = "data/food_nutrient.csv";

//preg_match_all("/.*?\"(1106|1104)\".*/", file_get_contents($food_nutrient), $food_nutrients);
preg_match_all("/.*?\"(1185|1183)\".*/", file_get_contents($food_nutrient), $food_nutrients);

print_r($food_nutrients);

?>
