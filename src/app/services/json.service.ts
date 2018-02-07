import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class JsonService {

  // private flatJson: Object;

  public flattenJson(json: Object): Observable<any> {
    return Observable.create(obsv => {
      obsv.next([this._flattenJson(json)]);
      obsv.complete();
    });
  }

  private _flattenJson(json: Object): Object {
    const flatJson = {};

    for (const key in json) {
      if (json.hasOwnProperty(key)) {
        if (typeof json[key] === 'object') {
          const flatChild = this.flattenJson(json[key]);
          for (const childKey in json[key]) {
            if (json[key][childKey].hasOwnProperty(childKey)) {
              flatJson[key + '.' + childKey] = flatChild[childKey];
            }
          }
        } else {
          flatJson[key] = json[key];
        }
      }
    }
    return flatJson;
  }

}
