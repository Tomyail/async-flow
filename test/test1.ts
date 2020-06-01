import { timer } from "rxjs";
import { mapTo } from "rxjs/operators";
import {flow } from '../index'

flow(
    {},
    [
      {
        name: "1",
        map: i => i,
        flow: () => {
          console.log("dur:11");
          return timer(2000).pipe(mapTo("22"));
        },
        children: {
          "1_1": {
            name: "1_1",
            map: i => i,
            flow: () => {
              console.log("dur:1_1");
              return timer(2000).pipe(mapTo("1_1"));
            },
            children: [
              {
                name: "1_1_1",
                map: (result, context) => {
                  console.log(context["1_1"] === "1_1");
                  return result;
                },
                flow: () => {
                  console.log("dur:1_1_1");
                  return timer(2000).pipe(mapTo("1_1_1"));
                }
              }
            ]
          }
        }
      },
      {
        name: "22",
        map: (result, context) => {
          return result;
        },
        flow: () => {
          console.log("dur:sss");
          return Promise.resolve("xx");
        }
      }
    ]
  ).subscribe(console.log);
  