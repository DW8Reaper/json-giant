import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';

import { JsonTreeData } from '../json-tree/json-tree.component';
import { JsonService } from '../services/json.service';

@Component({
  selector: 'app-radial-view',
  templateUrl: './radial-view.component.html',
  styleUrls: ['./radial-view.component.scss']
})
export class RadialViewComponent implements OnInit {

  @Input() json: JsonTreeData = null;
  @ViewChild('radialViewElement') radialViewElement: ElementRef;

  constructor(private jsonService: JsonService) {}

  ngOnInit() {
    if (this.json === null) {
      d3.select('svg').attr('innerTEXT', '');
      return;
    }

    this.jsonService.flattenJson(this.json.root.toJs()).subscribe(jsonTree => {

      const svg = d3.select('svg'),
      width = +svg.attr('width'),
      height = +svg.attr('height'),
      g = svg.append('g').attr('transform', 'translate(' + (width / 2 + 40) + ',' + (height / 2 + 90) + ')');

      const stratify = d3.stratify()
          .parentId(function(d) {
            const val = d.id.substring(0, d.id.lastIndexOf('.'));
            return val;
          });

      const tree = d3.tree()
          .size([2 * Math.PI, 500])
          .separation(function(a, b) { return (a.parent === b.parent ? 1 : 2) / a.depth; });


      const root = tree(stratify(jsonTree));
      const link = g.selectAll('.link')
        .data(root.links())
        .enter().append('path')
          .attr('class', 'link')
          .attr('d', d3.linkRadial()
              .angle(function(d) { return d.x; })
              .radius(function(d) { return d.y; }));

      const node = g.selectAll('.node')
        .data(root.descendants())
        .enter().append('g')
          .attr('class', function(d) { return 'node' + (d.children ? ' node--internal' : ' node--leaf'); })
          .attr('transform', function(d) { return 'translate(' + radialPoint(d.x, d.y) + ')'; });

      node.append('circle')
          .attr('r', 2.5);

      node.append('text')
          .attr('dy', '0.31em')
          .attr('x', function(d) { return d.x < Math.PI === !d.children ? 6 : -6; })
          .attr('text-anchor', function(d) { return d.x < Math.PI === !d.children ? 'start' : 'end'; })
          .attr('transform', function(d) { return 'rotate(' + (d.x < Math.PI ? d.x - Math.PI / 2 : d.x + Math.PI / 2) * 180 / Math.PI + ')'; })
          .text(function(d) { return d.id.substring(d.id.lastIndexOf('.') + 1); });

    });

    function radialPoint(x, y) {
      return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];
    }
  }
}
