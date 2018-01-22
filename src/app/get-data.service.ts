import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';

@Injectable()
export class GetDataService {

  constructor(private http: Http) { }

  // Get all posts from the API
  getAllData(datetime: string): Observable<any> {

    const url = '/api/posts:' + datetime;

    return this.http
    .get(url)
    .map(response => {
      return response.json();
    },  error => {
      return error;
   }).timeout(120000);
}

}
