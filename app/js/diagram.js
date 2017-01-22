function init() {
  var $ = go.GraphObject.make;

  myDiagram =
    $(go.Diagram, "myDiagramDiv",
      {
        allowDrop: true,
        initialContentAlignment: go.Spot.Center,
        "undoManager.isEnabled": true,
        layout: $(go.TreeLayout,
                  { // this only lays out in trees nodes connected by "generalization" links
                    angle: 90,
                    path: go.TreeLayout.PathSource,  // links go from child to parent
                    setsPortSpot: false,  // keep Spot.AllSides for link connection spot
                    setsChildPortSpot: false,  // keep Spot.AllSides
                    // nodes not connected by "generalization" links are laid out horizontally
                    arrangement: go.TreeLayout.ArrangementHorizontal
                  })
      });

  // show visibility or access as a single character at the beginning of each property or method
  function convertVisibility(v) {
    switch (v) {
      case "public": return "+";
      case "private": return "-";
      case "protected": return "#";
      case "package": return "~";
      default: return v;
    }
  }

  // the item template for properties
  var propertyTemplate =
    $(go.Panel, "Horizontal",
      // property visibility/access
      $(go.TextBlock,
        { isMultiline: false, editable: false, width: 12 },
        new go.Binding("text", "visibility", convertVisibility)),
      // property name, underlined if scope=="class" to indicate static property
      $(go.TextBlock,
        { isMultiline: false, editable: true },
        new go.Binding("text", "name").makeTwoWay(),
        new go.Binding("isUnderline", "scope", function(s) { return s[0] === 'c' })),
      // property type, if known
      $(go.TextBlock, "",
        new go.Binding("text", "type", function(t) { return (t ? ": " : ""); })),
      $(go.TextBlock,
        { isMultiline: false, editable: true },
        new go.Binding("text", "type").makeTwoWay()),
      // property default value, if any
      $(go.TextBlock,
        { isMultiline: false, editable: false },
        new go.Binding("text", "default", function(s) { return s ? " = " + s : ""; }))
    );

  // the item template for methods
  var methodTemplate =
    $(go.Panel, "Horizontal",
      // method visibility/access
      $(go.TextBlock,
        { isMultiline: false, editable: false, width: 12 },
        new go.Binding("text", "visibility", convertVisibility)),
      // method name, underlined if scope=="class" to indicate static method
      $(go.TextBlock,
        { isMultiline: false, editable: true },
        new go.Binding("text", "name").makeTwoWay(),
        new go.Binding("isUnderline", "scope", function(s) { return s[0] === 'c' })),
      // method parameters
      $(go.TextBlock, "()",
        // this does not permit adding/editing/removing of parameters via inplace edits
        new go.Binding("text", "parameters", function(parr) {
            var s = "(";
            for (var i = 0; i < parr.length; i++) {
              var param = parr[i];
              if (i > 0) s += ", ";
              s += param.name + ": " + param.type;
            }
            return s + ")";
        })),
      // method return type, if any
      $(go.TextBlock, "",
        new go.Binding("text", "type", function(t) { return (t ? ": " : ""); })),
      $(go.TextBlock,
        { isMultiline: false, editable: true },
        new go.Binding("text", "type").makeTwoWay())
    );

  // this simple template does not have any buttons to permit adding or
  // removing properties or methods, but it could!
  myDiagram.nodeTemplate =
    $(go.Node, "Auto",
      {
        locationSpot: go.Spot.Center,
        fromSpot: go.Spot.AllSides,
        toSpot: go.Spot.AllSides
      },
      $(go.Shape, { fill: "lightyellow" }),
      $(go.Panel, "Table",
        { defaultRowSeparatorStroke: "black" },
        // header
        $(go.TextBlock,
          {
            row: 0, columnSpan: 2, margin: 3, alignment: go.Spot.Center,
            font: "bold 12pt sans-serif",
            isMultiline: false, editable: true
          },
          new go.Binding("text", "name").makeTwoWay()),
        // properties
        $(go.TextBlock, "Properties",
          { row: 1, font: "italic 10pt sans-serif" },
          new go.Binding("visible", "visible", function(v) { return !v; }).ofObject("PROPERTIES")),
        $(go.Panel, "Vertical", { name: "PROPERTIES" },
          new go.Binding("itemArray", "properties"),
          {
            row: 1, margin: 3, stretch: go.GraphObject.Fill,
            defaultAlignment: go.Spot.Left, background: "lightyellow",
            itemTemplate: propertyTemplate
          }
        ),
        $("PanelExpanderButton", "PROPERTIES",
          { row: 1, column: 1, alignment: go.Spot.TopRight, visible: false },
          new go.Binding("visible", "properties", function(arr) { return arr.length > 0; })),
        // methods
        $(go.TextBlock, "Methods",
          { row: 2, font: "italic 10pt sans-serif" },
          new go.Binding("visible", "visible", function(v) { return !v; }).ofObject("METHODS")),
        $(go.Panel, "Vertical", { name: "METHODS" },
          new go.Binding("itemArray", "methods"),
          {
            row: 2, margin: 3, stretch: go.GraphObject.Fill,
            defaultAlignment: go.Spot.Left, background: "lightyellow",
            itemTemplate: methodTemplate
          }
        ),
        $("PanelExpanderButton", "METHODS",
          { row: 2, column: 1, alignment: go.Spot.TopRight, visible: false },
          new go.Binding("visible", "methods", function(arr) { return arr.length > 0; }))
      )
    );

  function convertIsTreeLink(r) {
    return r === "generalization";
  }

  function convertFromArrow(r) {
    switch (r) {
      case "generalization": return "";
      default: return "";
    }
  }

  function convertToArrow(r) {
    switch (r) {
      case "generalization": return "Triangle";
      case "aggregation": return "StretchedDiamond";
      default: return "";
    }
  }

  myDiagram.linkTemplate =
    $(go.Link,
      { routing: go.Link.Orthogonal },
      new go.Binding("isLayoutPositioned", "relationship", convertIsTreeLink),
      $(go.Shape),
      $(go.Shape, { scale: 1.3, fill: "white" },
        new go.Binding("fromArrow", "relationship", convertFromArrow)),
      $(go.Shape, { scale: 1.3, fill: "white" },
        new go.Binding("toArrow", "relationship", convertToArrow))
    );

  // setup a few example class nodes and relationships
  var nodedata = [
    {
      key: 1,
      name: "BankAccount",
      properties: [
        { name: "owner", type: "String", visibility: "public" },
        { name: "balance", type: "Currency", visibility: "public", default: "0" }
      ],
      methods: [
        { name: "deposit", parameters: [{ name: "amount", type: "Currency" }], visibility: "public" },
        { name: "withdraw", parameters: [{ name: "amount", type: "Currency" }], visibility: "public" }
      ]
    },
    {
      key: 2,
      name: "Prueba",
      properties: [
        { name: "owner", type: "String", visibility: "public" },
        { name: "balance", type: "Currency", visibility: "public", default: "0" }
      ],
      methods: [
        { name: "deposit", parameters: [{ name: "amount", type: "Currency" }], visibility: "public" },
        { name: "withdraw", parameters: [{ name: "amount", type: "Currency" }], visibility: "public" }
      ]
    },
    {
      key: 11,
      name: "Person",
      properties: [
        { name: "name", type: "String", visibility: "public" },
        { name: "birth", type: "Date", visibility: "protected" }
      ],
      methods: [
        { name: "getCurrentAge", type: "int", visibility: "public" }
      ]
    },
    {
      key: 12,
      name: "Student",
      properties: [
        { name: "classes", type: "List", visibility: "public" }
      ],
      methods: [
        { name: "attend", parameters: [{ name: "class", type: "Course" }], visibility: "private" },
        { name: "sleep", visibility: "private" }
      ]
    },
    {
      key: 13,
      name: "Professor",
      properties: [
        { name: "classes", type: "List", visibility: "public" }
      ],
      methods: [
        { name: "teach", parameters: [{ name: "class", type: "Course" }], visibility: "private" }
      ]
    },
    {
      key: 14,
      name: "Course",
      properties: [
        { name: "name", type: "String", visibility: "public" },
        { name: "description", type: "String", visibility: "public" },
        { name: "professor", type: "Professor", visibility: "public" },
        { name: "location", type: "String", visibility: "public" },
        { name: "times", type: "List", visibility: "public" },
        { name: "prerequisites", type: "List", visibility: "public" },
        { name: "students", type: "List", visibility: "public" }
      ]
    }
  ];
  var linkdata = [
    { from: 12, to: 11, relationship: "generalization" },
    { from: 1, to: 2, relationship: "generalization" },
    { from: 13, to: 11, relationship: "generalization" },
    { from: 14, to: 13, relationship: "aggregation" }
  ];
  myDiagram.model = $(go.GraphLinksModel,
    {
      copiesArrays: true,
      copiesArrayObjects: true,
      nodeDataArray: nodedata,
      linkDataArray: linkdata
    });
    // initialize the Palette that is on the left side of the page
   myPalette =
     $(go.Palette, "myPaletteDiv",  // must name or refer to the DIV HTML element
       {
         maxSelectionCount: 1,
         nodeTemplateMap: myDiagram.nodeTemplateMap,  // share the templates used by myDiagram
         linkTemplate: // simplify the link template, just in this Palette
           $(go.Link,
             { // because the GridLayout.alignment is Location and the nodes have locationSpot == Spot.Center,
               // to line up the Link in the same manner we have to pretend the Link has the same location spot
               locationSpot: go.Spot.Center,
               selectionAdornmentTemplate:
                 $(go.Adornment, "Link",
                   { locationSpot: go.Spot.Center },
                   $(go.Shape,
                     { isPanelMain: true, fill: null, stroke: "deepskyblue", strokeWidth: 0 }),
                   $(go.Shape,  // the arrowhead
                     { toArrow: "Standard", stroke: null })
                 )
             },
             {
               routing: go.Link.AvoidsNodes,
               curve: go.Link.JumpOver,
               corner: 5,
               toShortLength: 4
             },
             new go.Binding("points"),
             $(go.Shape,  // the link path shape
               { isPanelMain: true, strokeWidth: 2 }),
             $(go.Shape,  // the arrowhead
               { toArrow: "Standard", stroke: null })
           ),
         model: new go.GraphLinksModel([  // specify the contents of the Palette
           {
             key: 1,
             name: "NewClass",
           }
         ], [
           // the Palette also has a disconnected Link, which the user can drag-and-drop
           { points: new go.List(go.Point).addAll([new go.Point(0, 0), new go.Point(30, 0), new go.Point(30, 40), new go.Point(60, 40)]) }
         ])
       });
    myPalette = new go.Palette("myPaletteDiv");  // must name or refer to the DIV HTML element
    var fill1 = "rgb(105,210,231)"
    var brush1 = "rgb(65,180,181)";
    var fill2 = "rgb(167,219,216)"
    var brush2 = "rgb(127,179,176)";
    var fill3 = "rgb(224,228,204)"
    var brush3 = "rgb(184,188,164)";
    var fill4 = "rgb(243,134,48)"
    var brush4 = "rgb(203,84,08)";
    myPalette.nodeTemplateMap.add("", // default category
      $(go.Node, "Auto",
        { locationSpot: go.Spot.Center },
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        $(go.Shape, "Ellipse",
          { strokeWidth: 2, fill: fill1, name: "SHAPE" },
          new go.Binding("figure", "figure"),
          new go.Binding("fill", "fill"),
          new go.Binding("stroke", "stroke")
          ),
        $(go.TextBlock,
          { margin: 5,
            maxSize: new go.Size(200, NaN),
            wrap: go.TextBlock.WrapFit,
            textAlign: "center",
            editable: true,
            font: "bold 9pt Helvetica, Arial, sans-serif",
            name: "TEXT" },
          new go.Binding("text", "text").makeTwoWay())));
    myPalette.model = new go.GraphLinksModel([
      { text: "Lake", fill: fill1, stroke: brush1, figure: "Hexagon",name:"newClass" },
      { text: "Ocean", fill: fill2, stroke: brush2, figure: "Rectangle" },
      { text: "Sand", fill: fill3, stroke: brush3, figure: "Diamond" },
      { text: "Goldfish", fill: fill4, stroke: brush4, figure: "Octagon" }
    ]);
    myPalette.addDiagramListener("InitialLayoutCompleted", function(diagramEvent) {
      var pdrag = document.getElementById("paletteDraggable");
      var palette = diagramEvent.diagram;
      var paddingHorizontal = palette.padding.left + palette.padding.right;
      var paddingVertical = palette.padding.top + palette.padding.bottom;
      pdrag.style.width = palette.documentBounds.width + 20  + "px";
      pdrag.style.height = palette.documentBounds.height + 30 + "px";
    });
}
