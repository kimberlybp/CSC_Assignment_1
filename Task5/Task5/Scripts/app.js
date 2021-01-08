var selected = undefined;

$(document).ready(function () {
    var table = $('#s3content').DataTable();

    $('#s3content tbody').on('click', 'tr', function () {
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
        }
        else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
        }
    });
});

function generateBitly() {
    var results = $('.bitlyResults');
    results.html('<i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i>')
    var table = $('#s3content').DataTable();
    var selectedRowData = table.row('.selected').data();
    console.log(selectedRowData);
    if (selectedRowData) {
        const bucketLink = "https://task5bucket.s3.amazonaws.com/";
        var longurl = bucketLink + selectedRowData[1];
        const authToken = "8f89f0daa44aebacedec30c2fa95c7cb799f50e5";

        var bitlyUrl = JSON.stringify({ long_url: longurl });

        $.ajax({
            type: 'POST',
            headers: {
                'Authorization': 'Bearer ' + authToken,
                'Content-Type': 'application/json'
            },
            url: "https://api-ssl.bitly.com/v4/shorten",
            data: bitlyUrl,
            success: function (data) {
                console.log(data);
                results.html('Bitly link for ' + selectedRowData[1] + ": " + data.link);
            }
        })
    } else {
        results.html('Please select one file to generate bitly link.')

    }
}   

function on() {
    document.getElementById("loading-overlay").style.display = "block";
}


