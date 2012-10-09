#!/usr/bin/env node

/* 
	Update Google Chrome via Remote Debugging API
	Gustav Buchholtz <gustav.buchholtz@gmail.com> 2012
	
	Depends on ws
	
	Usage: 	./chrupdate.js [url] [host] [port]
			url can be part of url, i.e "./chrupdate localhost" updates all pages on localhost
			if url is left empty, all open pages will be updated.
			Host and port is where the Google Chrome Debug instance is run. Defaults to localhost:9222
*/

function ChrUpdate( url, host, port )
{
	var http = require("http"),
		WebSocket = require("ws"),
		debugHost = host || "localhost",
		debugPort = port || 9222,
		pageUrl = url,
		pages = [];

	this.update = function( )
	{
		// Get current chrome pages/tabs
		http.get( {host:debugHost, port:debugPort, path:"/json"}, function(res)
		{
			res.on("data", function(data)
			{
				pages = JSON.parse(data);
				_updatePages( );
			});
		}).on("error", function(){ console.log("Chrome needs to be started with Remote Debugging Enabled on port "+ debugPort +".\nFor OSX, run: open -a Google\\ Chrome --args --remote-debugging-port="+debugPort) });
	}
	
	function _updateChrome( page )
	{
		if (!page.webSocketDebuggerUrl)
		{
			console.log("Google Chrome does not support multiple debug clients (yet).\nClose the embedded developer tools and try again.");
			return false;
		}
	
		var ws = new WebSocket( page.webSocketDebuggerUrl );
		ws.on("open", function()
		{
			// reload Chrome page
			var req = 	{
							id: 0, 
							method: "Page.reload"
						};
			ws.send( JSON.stringify(req) );
			ws.close();
		});
		return true;
	}

	function _updatePages( ) // Update all pages/tabs with correct url
	{
		var updated = 0;
		for (var i = 0; i < pages.length; i++)
		{
			if ( pages[i].url.indexOf("chrome-devtools://") == -1 &&     // Do not update dev tools
				(pageUrl == "" || pages[i].url.indexOf( pageUrl ) > 0) ) // url empty or partial match
			{
				if (_updateChrome( pages[i] )) updated++;
			}
		}
		console.log("Updated " + updated + " page(s).");
	}
}

// Run this shit
var upd = new ChrUpdate( 	process.argv[2] || "",  // url
							process.argv[3] || "",  // host
							process.argv[4] || "" );// port
upd.update();