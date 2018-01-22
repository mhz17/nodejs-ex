import { Component, Input, NgModule } from '@angular/core';
import { GetDataService } from './get-data.service';
import { Football } from './football.model';
import { deserialize } from 'serializer.ts/Serializer';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/primeng';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Angular2Csv } from 'angular2-csv/Angular2-csv';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/take';
import 'rxjs/add/observable/interval';
import 'rxjs/add/observable/timer';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [GetDataService]
})
export class AppComponent {
  title = 'Football Results';
  footballData: Football[];
  dt: string;
  errorMessage: string;
  dataLoading: boolean;

  constructor(private service: GetDataService) {
    this.dataLoading = false;
  }

  showExportButton(): boolean {
    return (this.footballData === undefined || this.footballData === null ? false : this.footballData.length > 0);
  }

  removeValidation($event: any) {
    if (this.dt !== undefined) {
      this.errorMessage = '';
      this.dt = this.convertTime($event);
    }
  }

  convertTime(str: string) {
    const date = new Date(str);
    const mnth = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const year = (date.getFullYear());
    return year + '-' + mnth + '-' + day;
  }

  getAllData() {

    this.footballData = null;
    if (this.dt === undefined || this.dt === null) {
      this.errorMessage = 'Date cannot be blank';
    } else {
      this.errorMessage = '';
      this.dataLoading = true;

      const timer = Observable.timer(1000);

      this.service.getAllData(this.dt).take(1).subscribe(
        (data) => {
          this.footballData = data;
          for (const a of this.footballData) {
            deserialize<Football[]>(Football, a);
          }
          this.dataLoading = false;
        }, error => {
          this.dataLoading = false;
          this.errorMessage = error;
          return error;
        }
      );

    }

  }

  exportData() {
    const options = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalseparator: '.',
      showLabels: true,
      showTitle: false,
      useBom: true
    };
    const component = new Angular2Csv(this.footballData, 'FootballStats' + this.dt, options);
  }
}
