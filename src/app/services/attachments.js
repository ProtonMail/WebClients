angular.module("proton.attachments", [])
.service("attachments", function ($http, $log, $q, $rootScope) {
  return {
    load: function (file) {
      var q = $q.defer();
      if (!file) {
        q.reject(new TypeError("You did not provide a file"));
      }
      var fileObject = {};
      fileObject.FileName = file.name;
      fileObject.FileSize = file.size;
      fileObject.MIMEType = file.type;

      var reader = new FileReader();
      reader.onload = function (event) {
        fileObject.FileData = {
          self: event.target.result.split(",")[1]
        };
        if (fileObject.$promise.resolve) {
          fileObject.$promise.resolve(fileObject);
        }
      };
      reader.readAsDataURL(file);

      fileObject.$promise = q.promise;
      return fileObject;
    },
    get: function (id) {
      $http
        .get("/attachments" + id, {responseType: "arraybuffer"})
        .success(function (data, status, headers) {
          var filename,
              octetStreamMime = "application/octet-stream",
              contentType;

          // Get the headers
          headers = headers();

          if (!filename) {
            filename = headers["content-disposition"].split(';')[1].split("=")[1].trim();
          }

          // Determine the content type from the header or default to "application/octet-stream"
          contentType = headers["content-type"] || octetStreamMime;

          if (navigator.msSaveBlob) {
            var blob = new Blob([data], { type: contentType });
            navigator.msSaveBlob(blob, filename);
          } else {
            var urlCreator = window.URL || window.webkitURL || window.mozURL || window.msURL;
            if (urlCreator) {
              // Try to use a download link
              var link = document.createElement("a");

              if ("download" in link) {
                // Prepare a blob URL
                var blob = new Blob([data], { type: contentType });
                var url = urlCreator.createObjectURL(blob);

                link.setAttribute("href", url);
                link.setAttribute("download", filename);

                // Simulate clicking the download link
                var event = document.createEvent('MouseEvents');
                event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
                link.dispatchEvent(event);
              } else {
                // Prepare a blob URL
                // Use application/octet-stream when using window.location to force download
                var blob = new Blob([data], { type: octetStreamMime });
                var url = urlCreator.createObjectURL(blob);
                $window.location = url;
              }
            }
          }
      }).error(function (response) {
        $log.debug(response);
      });
    }
  };
})
