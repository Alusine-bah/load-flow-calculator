// line-rating.js
// Transmission line thermal loading analysis


function analyzeLineRatings(
  system,
  lineFlows,
  options = {}
) {


  const warningLimit =
    options.warningLimit || 90;


  const overloadLimit =
    options.overloadLimit || 100;



  const results = [];



  for (const flow of lineFlows) {


    const line = system.lines.find(
      l =>
        l.from === flow.from &&
        l.to === flow.to
    );



    if (!line) {

      continue;

    }



    const ratingMVA =
      line.ratingMVA;



    let loading = null;

    let status = "NO RATING";



    if (ratingMVA) {


      loading =
        flow.S_from_MVA /
        ratingMVA *
        100;



      if (loading >= overloadLimit) {

        status = "OVERLOAD";

      }

      else if (loading >= warningLimit) {

        status = "WARNING";

      }

      else {

        status = "NORMAL";

      }

    }



    results.push({


      from:
        flow.from,


      to:
        flow.to,


      flow_MVA:
        flow.S_from_MVA,


      rating_MVA:
        ratingMVA,


      loading_percent:
        loading,


      status:
        status

    });


  }



  return results;

}





function printLineRatings(results) {


  console.log("\nLINE THERMAL LOADING");

  console.log("------------------------------");



  console.log(
    "Line   Flow(MVA)   Rating(MVA)   Loading   Status"
  );



  for (const line of results) {


    console.log(

      `${line.from}-${line.to}   ` +

      `${line.flow_MVA.toFixed(2)}        ` +

      `${line.rating_MVA || "N/A"}          ` +

      `${
        line.loading_percent === null
        ? "N/A"
        : line.loading_percent.toFixed(2) + "%"
      }     ` +

      `${line.status}`

    );

  }

}



window.analyzeLineRatings =
  analyzeLineRatings;


window.printLineRatings =
  printLineRatings;