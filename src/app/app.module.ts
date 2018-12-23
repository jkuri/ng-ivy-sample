import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { RealtimeChartComponent } from './realtime-chart/realtime-chart.component';

@NgModule({
  declarations: [AppComponent, RealtimeChartComponent],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
