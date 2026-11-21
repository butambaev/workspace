from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    filterset_fields = ['is_read']

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationReadView(APIView):
    def patch(self, request, pk):
        n = generics.get_object_or_404(Notification, pk=pk, user=request.user)
        n.is_read = True
        n.save(update_fields=['is_read'])
        return Response(NotificationSerializer(n).data)


class NotificationReadAllView(APIView):
    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'detail': 'ok'})


class UnreadCountView(APIView):
    def get(self, request):
        return Response({'count': Notification.objects.filter(user=request.user, is_read=False).count()})
