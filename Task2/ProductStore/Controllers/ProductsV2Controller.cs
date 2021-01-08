using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ProductStore.Models;
using System.Web.Http.Cors;

namespace ProductStore.Controllers
{
    [EnableCors(origins: "https://localhost:44380", headers: "*", methods: "*")]
    public class ProductsV2Controller : ApiController
    {
        static readonly IProductRepository repository = new ProductRepository();

        [HttpGet]
        [Route("api/v2/products")]
        public IEnumerable<Product> GetAllProducts()
        {
            return repository.GetAll();
        }

        [HttpGet]
        [Route("api/v2/products/{id:int}", Name = "getProductById")]
        public Product GetProduct(int id)
        {
            Product item = repository.Get(id);
            if (item == null)
            {
            
            }
            return item;
        }

        [HttpGet]
        [Route("api/v2/products/{category}")]
        public IEnumerable<Product> GetProductsByCategory(string category)
        {
        return repository.GetAll().Where(
            p => string.Equals(p.Category, category, StringComparison.OrdinalIgnoreCase));
        }

        //public Product PostProduct(Product item)
        //{
        //    item = repository.Add(item);
        //    return item;
        //}

        [HttpPost]
        [Route("api/v2/products")]
        public HttpResponseMessage PostProduct(Product item)
        {
            if (ModelState.IsValid)
            {
                item = repository.Add(item);
                var response = Request.CreateResponse<Product>(HttpStatusCode.Created, item);

                string uri = Url.Link("getProductById", new { id = item.Id });
                response.Headers.Location = new Uri(uri);
                return response;
            }
            else
            {
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, ModelState);
            }

        }

        [HttpPut]
        [Route("api/v2/products/{id:int}")]
        public void PutProduct(int id, Product product)
        {
            product.Id = id;
            if (!repository.Update(product))
            {
            throw new HttpResponseException(HttpStatusCode.NotFound);
            }
            repository.Update(product);
        }

        [HttpDelete]
        [Route("api/v2/products/{id:int}")]
        public void DeleteProduct(int id)
        {
        Product item = repository.Get(id);
        if (item == null)
        {
            throw new HttpResponseException(HttpStatusCode.NotFound);
        }

        repository.Remove(id);
        }
}
}
