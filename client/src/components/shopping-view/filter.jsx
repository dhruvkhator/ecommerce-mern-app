import { Fragment } from "react";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Separator } from "../ui/separator";
import { useEffect, useState } from "react";
import { Range } from "react-range";
import { useCallback } from "react";
import { debounce } from "lodash"

const ProductFilter = ({ brands = [], categories = [], filters, filterList = [], handleFilter }) => {


  const priceRange = filterList?.priceRange || { min: 0, max: 0 };

  const [priceValues, setPriceValues] = useState([priceRange.min, priceRange.max]);

  useEffect(() => {
    if (filterList?.priceRange) {
      setPriceValues([filterList.priceRange.min, filterList.priceRange.max]);
    }
  }, [filterList]);


  const debouncedHandleFilter = useCallback(
    debounce((values) => {
       const [minPrice, maxPrice] = values;

    // Update both minPrice and maxPrice together
    handleFilter("price", { minPrice, maxPrice });
    }, 500),
    []
  );

  const handlePriceChange = (values) => {
    setPriceValues(values); // Update local state
    debouncedHandleFilter(values);
  };

  return (
    <div className="bg-background rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <h2 className="text-lg font-extrabold">Filters</h2>
      </div>
      <div className="p-4 space-y-4">
        {/* Filter by Brand */}
        {brands.length > 0 && (
          <Fragment>
            <div>
              <h3 className="text-base font-bold">Brand</h3>
              <div className="grid gap-2 mt-2">
                {brands.map((brand) => (
                  <Label className="flex font-medium items-center gap-2" key={brand._id}>
                    <Checkbox
                      checked={
                        filters &&
                        filters.brand &&
                        filters.brand.indexOf(brand._id) > -1
                      }
                      onCheckedChange={() => handleFilter("brand", brand._id)}
                    />
                    {brand.name}
                  </Label>
                ))}
              </div>
            </div>
            <Separator />
          </Fragment>
        )}

        {/* Filter by Category */}
        {categories.length > 0 && (
          <Fragment>
            <div>
              <h3 className="text-base font-bold">Category</h3>
              <div className="grid gap-2 mt-2">
                {categories.map((category) => (
                  <Label className="flex font-medium items-center gap-2" key={category._id}>
                    <Checkbox
                      checked={
                        filters &&
                        filters.category &&
                        filters.category.indexOf(category._id) > -1
                      }
                      onCheckedChange={() => handleFilter("category", category._id)}
                    />
                    {category.name}
                  </Label>
                ))}
              </div>
            </div>
            <Separator />
          </Fragment>
        )}

        {/* Dynamic Filters (from filterList) */}
        {filterList && Object.keys(filterList).length > 0 && Object.keys(filterList).map((filterKey) => (
          <Fragment key={filterKey}>
            <div>
              <h3 className="text-base font-bold">{filterKey}</h3>
              <div className="grid gap-2 mt-2">
                {Array.isArray(filterList[filterKey]) ? (
                  // Render array filters (e.g., Screen Size, Color)
                  filterList[filterKey].map((value) => (
                    <Label
                      className="flex font-medium items-center gap-2"
                      key={value}
                    >
                      <Checkbox
                        checked={
                          filters &&
                          filters[filterKey] &&
                          filters[filterKey].indexOf(value) > -1
                        }
                        onCheckedChange={() => handleFilter(filterKey, value)}
                      />
                      {value}
                    </Label>
                  ))
                ) : filterKey === "priceRange" && priceValues[0] !== priceValues[1] ? (
                  // Render slider for Price Range
                  <div className="px-4 py-2">
                    <Range
                      step={10} // Step value for the slider
                      min={priceRange.min}
                      max={priceRange.max}
                      values={priceValues}
                      onChange={(values) => setPriceValues(values)}
                      onFinalChange={(values) => handlePriceChange(values)} // Callback on value change
                      renderTrack={({ props, children }) => (
                        <div
                          {...props}
                          style={{
                            ...props.style,
                            height: "6px",
                            backgroundColor: "#ccc",
                          }}
                        >
                          {children}
                        </div>
                      )}
                      renderThumb={({ props }) => (
                        <div
                          {...props}
                          style={{
                            ...props.style,
                            height: "20px",
                            width: "20px",
                            backgroundColor: "#999",
                            borderRadius: "50%",
                          }}
                        />
                      )}
                    />
                    <div className="flex justify-between text-sm mt-2">
                      <span>${priceValues[0]}</span>
                      <span>${priceValues[1]}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <Separator />
          </Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProductFilter;


