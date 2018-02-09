import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class JsonService {

  // private flatJson: Object;

  public flattenJson(json: Object): Observable<any> {
    return Observable.create(obsv => {
      obsv.next(this._flattenJson({'root': json}));
      obsv.complete();
    });
  }

  private _flattenJson(json: Object): Object {
    let flatJson = [];

    for (const key in json) {
      if (json.hasOwnProperty(key)) {

        if (typeof json[key] === 'object') {
          flatJson.push({id: key, value: 0});

          for (const childKey in json[key]) {
            if (json[key].hasOwnProperty(childKey)) {
              const flatKey = key + '.' + childKey,
                    flatChild = {};

              // flatJson.push({id: flatKey, value: 1});
              flatChild[flatKey] = json[key][childKey];
              flatJson = flatJson.concat(this._flattenJson(flatChild));
            }
          }
        } else {
          flatJson.push({id: key, value: json[key]});
        }
      }
    }
    return flatJson;
  }

}
