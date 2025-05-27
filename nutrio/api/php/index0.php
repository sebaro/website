<?php

error_reporting(0);
error_reporting(E_ALL);
ini_set('display_errors', 'on');

// Search: by food name | by nutrient id -> q=search&t=food|nutriend&s=food_name|nutrient_id
// Report: by food id                    -> q=report&f=id

$food = "data/food.csv";
$nutrient = "data/nutrient.csv";
$food_nutrient = "data/food_nutrient.csv";

function search($string, $words) {
	$i = 0;
	foreach ($words as $word) {
		if (stripos($string, $word) !== false) $i++;
	}
	return ($i == count($words)) ? true : false;
}

$json = array();

if (isset($_GET["s"])) {
	$q = $_GET["s"];
	$csv = array_map("str_getcsv", file("$food"));
	foreach ($csv as $line) {
		//if (strpos(strtolower($line[2]), strtolower($q)) !== false) {
		if (search($line[2], explode(" ", $q))) {
			array_push($json, array("fdcId" => $line[0], "description" => $line[2]));
		}
	}
}
else if (isset($_GET["f"])) {
	$q = $_GET["f"];
	$values = array();
	preg_match_all("/.*?\"$q\".*/", file_get_contents($food_nutrient), $food_nutrient);
	$csv = array_map("str_getcsv", $food_nutrient[0]);
	foreach ($csv as $line) {
		if ($line[1] == $q) {
			$values[$line[2]] = $line[3];
		}
	}
	$csv = array_map("str_getcsv", file("$nutrient"));
	foreach ($csv as $line) {
		if (isset($values[$line[0]])) {
			array_push($json, array("name" => $line[1], "unit" => $line[2], "value" => $values[$line[0]]));
		}
	}
}
else if (isset($_GET["n"])) {
	$q = $_GET["n"];
	$r = (isset($_GET["r"])) ? $_GET["r"] : 100;
	foreach (explode(",", $q) as $q) {
		$unit = 1;
		$csv = array_map("str_getcsv", file("$nutrient"));
		foreach ($csv as $line) {
			if ($line[0] == $q) {
				if ($line[2] == "G") $unit = 1000000;
				else if ($line[2] == "MG") $unit = 1000;
				else if ($line[2] == "IU") $unit = 0.3;
				break;
			}
		}
		$values = array();
		preg_match_all("/.*?\"$q\".*/", file_get_contents($food_nutrient), $food_nutrients);
		$csv = array_map("str_getcsv", $food_nutrients[0]);
		foreach ($csv as $line) {
			if ($line[2] == $q && $line[3] > 0) {
				$values[$line[1]] = round($line[3] * $unit);
			}
		}
		$csv = array_map("str_getcsv", file("$food"));
		foreach ($csv as $line) {
			if (isset($values[$line[0]])) {
				array_push($json, array("name" => $line[2], "value" => $values[$line[0]]));
			}
		}
	}
	usort($json, function($a, $b) {
		return strnatcmp($b["value"], $a["value"]);
	});
	$json = array_slice($json, 0, $r);
}

if (count($json) == 0) {
	$json["errors"] = "No results found";
}

print_r(json_encode($json));

?>
