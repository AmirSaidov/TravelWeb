import { Link, useParams } from 'react-router-dom'
import { BookingCard } from '../components/tours/BookingCard.jsx'
import { useAppState } from '../store/context.js'

export function TourDetailsPage() {
  const { tourId } = useParams()
  const { tours } = useAppState()
  const tour = tours.find((item) => item.id === tourId)

  if (!tour) {
    return (
      <div className="shell">
        <div className="glass-card rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-extrabold text-slate-900">Tour not found</h1>
          <Link to="/tours" className="mt-4 inline-block text-sm font-semibold text-emerald-700">
            Go back to listing
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="shell">
      <div className="mb-7">
        <p className="text-sm text-slate-500">{tour.location}</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">{tour.title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          ★ {tour.rating} · {tour.reviews} reviews · Hosted by {tour.host}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
            <img src={tour.gallery[0]} alt={tour.title} className="h-80 w-full rounded-2xl object-cover" />
            <div className="grid gap-3">
              {tour.gallery.slice(1).map((image) => (
                <img key={image} src={image} alt={tour.title} className="h-[154px] w-full rounded-2xl object-cover" />
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-slate-900">About this experience</h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              {tour.summary} This route combines iconic landscapes, nomadic traditions and meaningful local connections.
              You will travel at a comfortable pace and explore hidden valleys with expert guides.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-slate-900">What's included</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {tour.includes.map((item) => (
                <p key={item} className="text-sm text-slate-600">
                  <span className="mr-2 text-emerald-500">✓</span>
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>

        <BookingCard tour={tour} />
      </div>
    </div>
  )
}
