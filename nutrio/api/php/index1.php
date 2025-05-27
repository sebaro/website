<?php

error_reporting(0);
error_reporting(E_ALL);
ini_set('display_errors', 'on');

// Search: by food name | by nutrient id -> q=search&t=food|nutrient&s=food_name|nutrient_id
// Report: by food id                    -> q=report&s=food_id

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

$q = (isset($_GET["q"])) ? trim($_GET["q"]) : "";
$t = (isset($_GET["t"])) ? trim($_GET["t"]) : "food";
$s = (isset($_GET["s"])) ? trim($_GET["s"]) : "";

$json = array();

if ($q && $q == "search" && $s) {
	$foods = array();
	if ($t == "food") {
		$csv = array_map("str_getcsv", file("$food"));
		foreach ($csv as $line) {
			if (search($line[2], explode(" ", $s))) {
				if (!isset($foods[$line[0]])) {
					array_push($json, array("id" => $line[0], "name" => $line[2]));
					$foods[$line[0]] = $line[2];
				}
			}
		}
		usort($json, function($a, $b) {
			return strnatcmp($a["name"], $b["name"]);
		});
	}
	else {
		$r = (isset($_GET["r"])) ? $_GET["r"] : 500;
		$d = "";
		$i = explode(" ", $s);
		if (stripos($s, "or") !== false) {
			$d = "or";
			$i = explode("or", $s);
		}
		else if (stripos($s, "and") !== false) {
			$d = "and";
			$i = explode("and", $s);
		}
		$units = array();
		$csv = array_map("str_getcsv", file("$nutrient"));
		foreach ($csv as $line) {
			if (in_array($line[0], $i)) {
				$unit = 1;
				if ($line[2] == "G") $unit = 1000000;
				else if ($line[2] == "MG") $unit = 1000;
				else if ($line[2] == "IU") $unit = 0.3;
				echo $line[0] . $line[2] . $unit . "<br>" ;
				$units[$line[0]] = $unit;
			}
		}
		$values = array();
		$p = implode("|", $i);
		preg_match_all("/.*?\"($p)\".*/", file_get_contents($food_nutrient), $food_nutrients);
		$csv = array_map("str_getcsv", $food_nutrients[0]);
		foreach ($csv as $line) {
			if (in_array($line[2], $i) && $line[3] > 0) {
				$values[$line[1]][$line[2]] = $line[3] * $units[$line[2]];
			}
		}
		$csv = array_map("str_getcsv", file("$food"));
		foreach ($csv as $line) {
			if (isset($values[$line[0]])) {
				if (!isset($foods[$line[0]])) {
					$v = 0;
					if ($d == "or") {
						foreach ($i as $e) {
							if (array_key_exists($e, $values[$line[0]])) {
								$v = $values[$line[0]][$e];
								break;
							}
						}
					}
					else if ($d == "and") {
						foreach ($i as $e) {
							if (array_key_exists($e, $values[$line[0]])) {
								$v += $values[$line[0]][$e];
							}
						}
					}
					else {
						$v = $values[$line[0]][$i[0]];
					}
					array_push($json, array("id" => $line[0], "name" => $line[2], "value" => $v));
					$foods[$line[0]] = $line[2];
				}
			}
		}
print_r($json);

			//$values = array();*/
			//preg_match_all("/.*?\"$s\".*/", file_get_contents($food_nutrient), $food_nutrients);
			/*$csv = array_map("str_getcsv", $food_nutrients[0]);
			foreach ($csv as $line) {
				if ($line[2] == $s && $line[3] > 0) {
					$values[$line[1]] = round($line[3] * $unit);
				}
			}


		/*****foreach (explode(",", $s) as $s) {
			$unit = 1;
			$csv = array_map("str_getcsv", file("$nutrient"));
			foreach ($csv as $line) {
				if ($line[0] == $s) {
					if ($line[2] == "G") $unit = 1000000;
					else if ($line[2] == "MG") $unit = 1000;
					else if ($line[2] == "IU") $unit = 0.3;
					break;
				}
			}
			$values = array();*/
			//preg_match_all("/.*?\"$s\".*/", file_get_contents($food_nutrient), $food_nutrients);
			/*$csv = array_map("str_getcsv", $food_nutrients[0]);
			foreach ($csv as $line) {
				if ($line[2] == $s && $line[3] > 0) {
					$values[$line[1]] = round($line[3] * $unit);
				}
			}
			$csv = array_map("str_getcsv", file("$food"));
			foreach ($csv as $line) {
				if (isset($values[$line[0]])) {
					if (!isset($foods[$line[0]])) {
						array_push($json, array("id" => $line[0], "name" => $line[2], "value" => $values[$line[0]]));
						$foods[$line[0]] = $line[2];
					}
				}
			}
		}*/
		//$json = array_map("unserialize", array_unique(array_map("serialize", $json)));
		usort($json, function($a, $b) {
			return strnatcmp($b["value"], $a["value"]);
		});
		$json = array_slice($json, 0, $r);
	}
}
else if ($q && $q == "report" && $s) {
	$values = array();
	preg_match_all("/.*?\"$s\".*/", file_get_contents($food_nutrient), $food_nutrients);
	$csv = array_map("str_getcsv", $food_nutrients[0]);
	foreach ($csv as $line) {
		if ($line[1] == $s) {
			$values[$line[2]] = $line[3];
		}
	}
	$csv = array_map("str_getcsv", file("$nutrient"));
	foreach ($csv as $line) {
		if (isset($values[$line[0]])) {
			array_push($json, array("id" => $line[0], "name" => $line[1], "unit" => $line[2], "value" => $values[$line[0]]));
		}
	}
}

if (count($json) == 0) {
	$json["errors"] = "No results found";
}

print_r(json_encode($json));

?>
