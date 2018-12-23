import { Component, OnInit, Input, HostListener, ViewChild, AfterViewInit } from '@angular/core';
import { select } from 'd3-selection';
import { axisBottom, axisLeft } from 'd3-axis';
import { scaleLinear, scaleTime } from 'd3-scale';
import { line, area, curveBasis } from 'd3-shape';
import { easeLinear } from 'd3-ease';
import { range } from 'd3-array';
import { timeFormat } from 'd3-time-format';
import 'd3-transition';

export class RealTimeChartSettings {
  constructor(
    public margin: { top: number, right: number, bottom: number, left: number } = { top: 25, right: 25, bottom: 25, left: 35 },
    public colors: string[] = ['#1665D8', '#34AA44', '#E6492D', '#FACF55', '#F6AB2F', '#6B6C6F'],
    public formatTime: string = '%H:%M:%S'
  ) { }
}

@Component({
  selector: 'app-realtime-chart',
  templateUrl: './realtime-chart.component.html'
})
export class RealtimeChartComponent implements OnInit, AfterViewInit {
  @Input() values: number[];
  @Input() settings: RealTimeChartSettings = new RealTimeChartSettings();

  @ViewChild('chart') chartElement: any;

  now: Date;
  n = 40;
  duration = 1000;

  formatTime: (date: Date) => string;

  data: number[][];
  el: HTMLElement;
  width: number;
  height: number;
  x: any;
  y: any;
  line: any;
  linePaths: any[];
  svg: any;
  g: any;
  xAxis: any;
  yAxis: any;
  area: any;
  areaPaths: any[];
  clipPath: any;

  constructor() { }

  ngOnInit() { }

  ngAfterViewInit() {
    if (!this.values || !this.values.length) {
      return;
    }

    if (!this.svg) {
      this.initChart();
    }
  }

  initChart(): void {
    this.now = new Date(Date.now() - this.duration);
    this.data = range(this.values.length).map(() => range(this.n).map(() => -1));
    this.formatTime = timeFormat(this.settings.formatTime);

    this.el = this.chartElement.nativeElement;
    this.width = this.el.clientWidth - this.settings.margin.left - this.settings.margin.right;
    this.height = this.el.clientHeight - this.settings.margin.top - this.settings.margin.bottom;

    this.x = scaleTime().range([0, this.width]);
    this.y = scaleLinear().range([this.height, 0]);

    this.x.domain([<any>this.now - (this.n - 2) * this.duration, <any>this.now - this.duration]);
    this.y.domain([0, 100]);

    this.line = line()
      .x((d: any, i: number) => this.x(<any>this.now - (this.n - 1 - i) * this.duration))
      .y((d: any) => this.y(d))
      .curve(curveBasis);

    this.area = area()
      .x((d: any, i: number) => this.x(<any>this.now - (this.n - 1 - i) * this.duration))
      .y1((d: any) => this.y(d))
      .y0(this.y(0))
      .curve(curveBasis);

    this.svg = select(this.el).append('svg')
      .attr('width', this.width + this.settings.margin.left + this.settings.margin.right)
      .attr('height', this.height + this.settings.margin.top + this.settings.margin.bottom);

    this.g = this.svg.append('g')
      .attr('transform', `translate(${this.settings.margin.left}, ${this.settings.margin.top})`);

    this.clipPath = this.svg.append('defs').append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('transform', `translate(0, 0)`);

    this.drawAxes();

    this.linePaths = Array.from(new Array(this.data.length), (x: number, i: number) => {
      return this.svg
        .append('g')
        .attr('transform', `translate(${this.settings.margin.left}, ${this.settings.margin.top})`)
        .attr('clip-path', 'url(#clip)')
        .append('path')
        .datum(this.data[i])
        .attr('class', 'line')
        .attr('d', this.line)
        .attr('stroke', this.settings.colors[i]);
    });

    this.areaPaths = Array.from(new Array(this.data.length), (x: number, i: number) => {
      return this.svg
        .append('g')
        .attr('transform', `translate(${this.settings.margin.left}, ${this.settings.margin.top})`)
        .attr('clip-path', 'url(#clip)')
        .append('path')
        .datum(this.data[i])
        .attr('class', 'line')
        .attr('d', this.area)
        .style('fill', this.settings.colors[i])
        .style('fill-opacity', 0.25);
    });

    this.tick();
  }

  tick(): void {
    this.now = new Date();
    this.data.forEach((d: number[], i: number) => d.push(this.values[i] || -1));
    this.x.domain([<any>this.now - (this.n - 2) * this.duration, <any>this.now - this.duration]);

    this.linePaths.forEach(path => {
      path
        .attr('d', this.line)
        .attr('transform', null)
        .transition()
        .duration(this.duration)
        .ease(easeLinear)
        .attr('transform', `translate(${this.x(<any>this.now - (this.n - 1) * this.duration)})`);
    });

    this.areaPaths.forEach(areaPath => {
      areaPath
        .attr('d', this.area)
        .attr('transform', null)
        .transition()
        .duration(this.duration)
        .ease(easeLinear)
        .attr('transform', `translate(${this.x(<any>this.now - (this.n - 1) * this.duration)})`);
    });

    this.g.select('.x.axis')
      .transition()
      .duration(this.duration)
      .ease(easeLinear)
      .call(axisBottom(this.x).tickFormat(this.formatTime).tickSizeInner(-this.height).tickSizeOuter(0).tickPadding(10))
      .on('end', () => this.tick());

    this.data.forEach(d => d.shift());
  }

  drawAxes(): void {
    this.xAxis = this.g.append('g')
      .attr('class', 'x axis')
      .call(axisBottom(this.x).tickFormat(this.formatTime).tickSizeInner(-this.height).tickSizeOuter(0).tickPadding(10))
      .attr('transform', `translate(0, ${this.y(0)})`);

    this.yAxis = this.g.append('g')
      .attr('class', 'y axis')
      .call(axisLeft(this.y).tickSize(-this.width).tickPadding(10).ticks(5));
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.width = this.el.clientWidth - this.settings.margin.left - this.settings.margin.right;
    this.height = this.el.clientHeight - this.settings.margin.top - this.settings.margin.bottom;

    this.x.range([0, this.width]);
    this.y.range([this.height, 0]);

    this.svg
      .attr('width', this.width + this.settings.margin.left + this.settings.margin.right)
      .attr('height', this.height + this.settings.margin.top + this.settings.margin.bottom);

    this.clipPath
      .attr('width', this.width)
      .attr('height', this.height);

    this.g.select('.x.axis')
      .call(axisBottom(this.x).tickFormat(this.formatTime).tickSizeInner(-this.height).tickSizeOuter(0).tickPadding(10));

    this.g.select('.y.axis')
      .call(axisLeft(this.y).tickSize(-this.width).tickPadding(10).ticks(5));
  }
}
