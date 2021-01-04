using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.IO;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using System;
using System.Collections;
using System.Configuration;
using System.Diagnostics;
using System.IO;
using System.Web;
using System.Web.Configuration;
using System.Web.Mvc;


namespace Task5.Controllers
{
    public class HomeController : Controller
    {
        private const string keyName = "test.jpg";
        private const string filePath = null;
        // Specify your bucket region (an example region is shown).  
        private static readonly string bucketName = ConfigurationManager.AppSettings.Get("BucketName");
        private static readonly RegionEndpoint bucketRegion = RegionEndpoint.USEast1;
        private static readonly string accesskey = ConfigurationManager.AppSettings.Get("AWSAccessKey");
        private static readonly string secretkey = ConfigurationManager.AppSettings.Get("AWSSecretKey");
        private static readonly string sessiontoken = ConfigurationManager.AppSettings.Get("AWSSessionToken");

        public static bool CheckForInternetConnection()
        {
            try
            {
                using (var client = new System.Net.WebClient())
                using (client.OpenRead("http://google.com/generate_204"))
                    return true;
            }
            catch
            {
                return false;
            }
        }

        public ActionResult Index()
        {
            return View();
        }

        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }

        [HttpGet]
        public ActionResult UploadImage()
        {
            ArrayList al = new ArrayList();
            if (CheckForInternetConnection())
            {
                try
                {
                    var sessionCredentials = new SessionAWSCredentials(accesskey, secretkey, sessiontoken);
                    var s3Client = new AmazonS3Client(sessionCredentials, bucketRegion);

                    S3DirectoryInfo di = new S3DirectoryInfo(s3Client, bucketName);
                    IS3FileSystemInfo[] files = di.GetFileSystemInfos();
                    foreach (S3FileInfo file in files)
                    {
                        Console.WriteLine($"{file.Name}");
                        al.Add(file.Name);
                    }
                }
                catch (Exception e)
                {
                    ViewBag.Error = true;
                }
            }
            else
            {
                ViewBag.Error = true;
            }

            ViewBag.Array = al;

            return View();
        }

        [HttpPost]
        public ActionResult UploadImage(HttpPostedFileBase file)
        {

            var sessionCredentials = new SessionAWSCredentials(accesskey, secretkey, sessiontoken);
            var s3Client = new AmazonS3Client(sessionCredentials, bucketRegion);

            var fileTransferUtility = new TransferUtility(s3Client);
            try
            {
                if (file != null && file.ContentLength > 0)
                {

                    var fileTransferUtilityRequest = new TransferUtilityUploadRequest
                    {
                        BucketName = bucketName,
                        InputStream = file.InputStream,
                        StorageClass = S3StorageClass.StandardInfrequentAccess,
                        PartSize = 6291456, // 6 MB.  
                        Key = file.FileName,
                        CannedACL = S3CannedACL.PublicRead
                    };
                    fileTransferUtilityRequest.Metadata.Add("param1", "Value1");
                    fileTransferUtilityRequest.Metadata.Add("param2", "Value2");
                    fileTransferUtility.Upload(fileTransferUtilityRequest);
                    fileTransferUtility.Dispose();
                    ViewBag.Message = "File Uploaded Successfully!!";
                }
                else
                {
                    ViewBag.Message = "Please choose a file to upload!";
                }

            }

            catch (AmazonS3Exception amazonS3Exception)
            {
                if (amazonS3Exception.ErrorCode != null &&
                    (amazonS3Exception.ErrorCode.Equals("InvalidAccessKeyId")
                    ||
                    amazonS3Exception.ErrorCode.Equals("InvalidSecurity")))
                {
                    ViewBag.Message = "Check the provided AWS Credentials.";
                    Debug.WriteLine(amazonS3Exception.ErrorCode + " !!");
                }
                else
                {
                    ViewBag.Message = "Error occurred: " + amazonS3Exception.Message;
                }
            }

            ArrayList al = new ArrayList();

            S3DirectoryInfo di = new S3DirectoryInfo(s3Client, bucketName);
            IS3FileSystemInfo[] files = di.GetFileSystemInfos();
            foreach (S3FileInfo f in files)
            {
                Console.WriteLine($"{f.Name}");
                al.Add(f.Name);
            }
            ViewBag.Array = al;
            return View();
        }
    }


}